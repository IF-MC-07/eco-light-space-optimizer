import pytest
import time
from datetime import datetime, time as dt_time
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
        return ScheduleRunner()

    @pytest.fixture
    def mock_db_connection(self, mocker):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
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
        # Set current time to 08:30:00
        mock_now = datetime(2023, 10, 27, 8, 30, 0)
        mock_datetime.now.return_value = mock_now
        mock_time.return_value = 1000.0 # Arbitrary timestamp

        # DB returns 1 schedule: 08:00 to 10:00
        mock_db_connection.fetchall.return_value = [
            (1, 101, "Pagi", "08:00:00", "10:00:00")
        ]
        
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
