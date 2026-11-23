import pytest
import time
from datetime import datetime, time as dt_time, timezone
from zoneinfo import ZoneInfo
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.schedule_runner import ScheduleRunner, last_manual_command_time

class TestScheduleRunner:
    @pytest.fixture
    def runner(self):
        # Reset state between tests
        last_manual_command_time.clear()
        r = ScheduleRunner()
        r._holiday_cache = {}
        return r

    @pytest.fixture
    def mock_db_connection(self, mocker):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchone.return_value = None
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mocker.patch('app.schedule_runner.get_db_connection', return_value=mock_conn)
        return mock_cur

    @pytest.fixture
    def mock_mqtt(self, mocker):
        return mocker.patch('app.schedule_runner.mqtt_commander')

    def test_convert_time_to_seconds(self, runner):
        assert runner._convert_time_to_seconds("08:30:00") == 8 * 3600 + 30 * 60
        assert runner._convert_time_to_seconds("09:15") == 9 * 3600 + 15 * 60
        assert runner._convert_time_to_seconds(dt_time(10, 45, 0)) == 10 * 3600 + 45 * 60

    @patch('app.schedule_runner.datetime')
    @patch('app.schedule_runner.time.time')
    def test_process_schedules_turn_on(self, mock_time, mock_datetime, runner, mock_db_connection, mocker):
        # Set current time to 08:30:00 (Friday 2023-10-27)
        mock_now = datetime(2023, 10, 27, 8, 30, 0)
        mock_datetime.now.return_value = mock_now
        mock_time.return_value = 1000.0 # Arbitrary timestamp

        # DB returns 1 schedule: 08:00 to 10:00
        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00")
        ]
        mock_db_connection.fetchone.return_value = None
        
        # Spy on trigger method
        mock_trigger = mocker.patch.object(runner, '_trigger_room_devices')

        runner.process_schedules()

        # Should be triggered ON
        mock_trigger.assert_called_once_with(101, "ON")
        assert runner.triggered_on[1] == "2023-10-27"

        # Calling again should not trigger (already triggered today)
        mock_trigger.reset_mock()
        runner.process_schedules()
        mock_trigger.assert_not_called()

    @patch('app.schedule_runner.datetime')
    @patch('app.schedule_runner.time.time')
    def test_process_schedules_turn_off(self, mock_time, mock_datetime, runner, mock_db_connection, mocker):
        # Set current time to 10:00:30 (within 60 secs after end)
        mock_now = datetime(2023, 10, 27, 10, 0, 30)
        mock_datetime.now.return_value = mock_now
        mock_time.return_value = 1000.0

        # DB returns 1 schedule: 08:00 to 10:00
        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00")
        ]
        mock_db_connection.fetchone.return_value = None
        
        mock_trigger = mocker.patch.object(runner, '_trigger_room_devices')

        runner.process_schedules()

        # Should be triggered OFF
        mock_trigger.assert_called_once_with(101, "OFF")
        assert runner.triggered_off[1] == "2023-10-27"

    @patch('app.schedule_runner.datetime')
    @patch('app.schedule_runner.time.time')
    def test_manual_lockout_skips_schedule(self, mock_time, mock_datetime, runner, mock_db_connection, mocker):
        mock_now = datetime(2023, 10, 27, 8, 30, 0)
        mock_datetime.now.return_value = mock_now
        
        # Lockout started 100 seconds ago (less than 300)
        current_time = 1000.0
        mock_time.return_value = current_time
        last_manual_command_time[101] = current_time - 100

        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00")
        ]
        mock_db_connection.fetchone.return_value = None
        
        mock_trigger = mocker.patch.object(runner, '_trigger_room_devices')

        runner.process_schedules()

        # Should skip because of lockout
        mock_trigger.assert_not_called()

    def test_trigger_room_devices(self, runner, mock_db_connection, mock_mqtt):
        # DB returns devices
        mock_db_connection.fetchall.return_value = [
            (10, 'light', 2, 20, "ZoneA"),
            (11, 'ac', None, None, None)
        ]
        
        # Second call to fetchone is for AC temperature setting
        mock_db_connection.fetchone.return_value = (24.0,)

        runner._trigger_room_devices(101, "ON")

        mock_mqtt.send_light_command.assert_called_once_with(
            room_id=101, relay_channel=2, command="ON", zone_id=20, zone_name="ZoneA", source="schedule"
        )
        
        mock_mqtt.send_ac_command.assert_called_once_with(
            room_id=101, command="ON", temperature=24.0, source="schedule"
        )

    # --- TAHAP 5 & 5B Holiday Suspension Tests ---

    def test_is_schedule_active_today_weekday_matching(self, runner):
        # Monday 2027-01-04 09:00:00
        dt_mon = datetime(2027, 1, 4, 9, 0, 0)
        assert runner._is_schedule_active_today("MON,TUE,WED", "Jadwal Kuliah", dt_mon) is True
        assert runner._is_schedule_active_today("THU,FRI", "Jadwal Kuliah", dt_mon) is False

    @patch('app.schedule_runner.datetime')
    @patch('app.schedule_runner.time.time')
    def test_process_schedules_holiday_skips_on_but_runs_off(self, mock_time, mock_datetime, runner, mock_db_connection, mocker):
        # Friday 2027-01-01 (Tahun Baru - libur dengan suspend_rules=True)
        # 1. Test Turn-ON at 08:30:00 -> Skipped on holiday
        mock_now_on = datetime(2027, 1, 1, 8, 30, 0)
        mock_datetime.now.return_value = mock_now_on
        mock_time.return_value = 1000.0

        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00", "MON,FRI")
        ]
        # Holiday query returns holiday
        mock_db_connection.fetchone.return_value = ("Tahun Baru", True)

        mock_trigger = mocker.patch.object(runner, '_trigger_room_devices')

        runner.process_schedules()

        # Turn ON must NOT be triggered
        mock_trigger.assert_not_called()
        assert runner.triggered_on[1] == "2027-01-01"

        # 2. Test Turn-OFF at 10:00:30 -> Always runs even on holiday
        mock_now_off = datetime(2027, 1, 1, 10, 0, 30)
        mock_datetime.now.return_value = mock_now_off
        mock_time.return_value = 1000.0 + 5430.0

        runner.process_schedules()

        # Turn OFF MUST be triggered
        mock_trigger.assert_called_once_with(101, "OFF")
        assert runner.triggered_off[1] == "2027-01-01"

    @patch('app.schedule_runner.time.time')
    def test_holiday_cache_ttl_60_seconds(self, mock_time, runner, mock_db_connection):
        dt = datetime(2027, 1, 1, 10, 0, 0)
        mock_db_connection.fetchone.return_value = ("Tahun Baru", True)

        # t0 = 1000.0 -> DB query
        mock_time.return_value = 1000.0
        is_h1, name1 = runner._is_holiday_today(dt)
        assert is_h1 is True
        assert name1 == "Tahun Baru"
        assert mock_db_connection.execute.call_count == 1

        # t0 + 30s -> Cache hit (DB not queried again)
        mock_time.return_value = 1030.0
        is_h2, name2 = runner._is_holiday_today(dt)
        assert is_h2 is True
        assert mock_db_connection.execute.call_count == 1

        # t0 + 61s -> Cache expired (DB queried second time)
        mock_time.return_value = 1061.0
        is_h3, name3 = runner._is_holiday_today(dt)
        assert is_h3 is True
        assert mock_db_connection.execute.call_count == 2

    @patch('app.schedule_runner.time.time')
    def test_holiday_fail_open_with_hourly_log_rate_limit(self, mock_time, runner, mock_db_connection, caplog):
        import logging
        caplog.set_level(logging.WARNING)

        dt = datetime(2027, 1, 1, 10, 0, 0)
        # Simulate database failure
        mock_db_connection.execute.side_effect = Exception("relation 'holidays' does not exist")

        # t0 = 1000.0 -> Fails open, logs warning once
        mock_time.return_value = 1000.0
        is_h1, name1 = runner._is_holiday_today(dt)
        assert is_h1 is False
        assert name1 == ""
        assert "HOLIDAY FAIL-OPEN" in caplog.text

        caplog.clear()

        # t0 + 100s -> Fails open, rate limit prevents duplicate warning
        mock_time.return_value = 1100.0
        # Invalidate 60s cache to force DB re-attempt
        runner._holiday_cache = {}
        is_h2, name2 = runner._is_holiday_today(dt)
        assert is_h2 is False
        assert "HOLIDAY FAIL-OPEN" not in caplog.text

        # t0 + 3700s (> 3600s) -> Warning logged again
        mock_time.return_value = 4700.0
        runner._holiday_cache = {}
        is_h3, name3 = runner._is_holiday_today(dt)
        assert is_h3 is False
        assert "HOLIDAY FAIL-OPEN" in caplog.text

    @patch('app.schedule_runner.datetime')
    @patch('app.schedule_runner.time.time')
    def test_fail_open_allows_schedule_turn_on(self, mock_time, mock_datetime, runner, mock_db_connection, mocker):
        # When holiday query fails, scheduler must run normally (persis seperti sebelum fitur libur)
        mock_now = datetime(2027, 1, 1, 8, 30, 0)
        mock_datetime.now.return_value = mock_now
        mock_time.return_value = 1000.0

        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00", "MON,FRI")
        ]
        # DB failure when querying holidays
        mock_db_connection.execute.side_effect = [
            None, # for fetchall of automation_schedules
            Exception("DB error on holidays table") # for holidays query
        ]

        mock_trigger = mocker.patch.object(runner, '_trigger_room_devices')

        runner.process_schedules()

        # Should fail open and turn ON normally
        mock_trigger.assert_called_once_with(101, "ON")
