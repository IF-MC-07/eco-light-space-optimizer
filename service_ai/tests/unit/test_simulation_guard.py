import pytest
from unittest.mock import MagicMock, patch

from app.simulation_guard import (
    is_simulated_room,
    clear_guard_cache,
    get_guard_ttl,
)
from app.mqtt_commands import MQTTCommander
from app.schedule_runner import ScheduleRunner
from app.boot_recovery import BootRecoveryManager


@pytest.fixture(autouse=True)
def reset_cache():
    clear_guard_cache()
    yield
    clear_guard_cache()


# ── Helper tests ─────────────────────────────────────────────────────────────

def test_is_simulated_room_empty_or_none():
    assert is_simulated_room("") is False
    assert is_simulated_room(None) is False


def test_is_simulated_room_true():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = (True,)
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    with patch("app.simulation_guard.get_db_connection", return_value=mock_conn):
        assert is_simulated_room("ROM-s01") is True


def test_is_simulated_room_false():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = (False,)
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    with patch("app.simulation_guard.get_db_connection", return_value=mock_conn):
        assert is_simulated_room("ROM-001") is False


def test_is_simulated_room_not_found_returns_false():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = None
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    with patch("app.simulation_guard.get_db_connection", return_value=mock_conn):
        assert is_simulated_room("ROM-unknown") is False


def test_is_simulated_room_db_error_returns_false():
    with patch("app.simulation_guard.get_db_connection", side_effect=Exception("DB down")):
        assert is_simulated_room("ROM-err") is False


def test_is_simulated_room_cache_behavior():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = (True,)
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    with patch("app.simulation_guard.get_db_connection", return_value=mock_conn) as get_conn_mock:
        # First call hits DB
        res1 = is_simulated_room("ROM-cache")
        assert res1 is True
        assert get_conn_mock.call_count == 1

        # Second call hits cache
        res2 = is_simulated_room("ROM-cache")
        assert res2 is True
        assert get_conn_mock.call_count == 1


# ── MQTT Commands Guard Tests ────────────────────────────────────────────────

def test_mqtt_commands_simulated_room_blocks_publish():
    commander = MQTTCommander()
    with patch("app.mqtt_commands.is_simulated_room", return_value=True), \
         patch("app.mqtt_commands.mqtt_client.publish") as mock_publish:
        
        commander.send_light_command("ROM-s01", 1, "ON", 10, "Zone 1")
        commander.send_ac_command("ROM-s01", "ON", 22.0)
        commander.request_status("ROM-s01")

        mock_publish.assert_not_called()


def test_mqtt_commands_physical_room_publishes():
    commander = MQTTCommander()
    with patch("app.mqtt_commands.is_simulated_room", return_value=False), \
         patch("app.mqtt_commands.mqtt_client.publish", return_value=True) as mock_publish:
        
        commander.send_light_command("ROM-001", 1, "ON", 10, "Zone 1")
        assert mock_publish.call_count == 1
        args, _ = mock_publish.call_args
        assert args[0] == "devices/ROM-001/light/1"
        assert args[1]["command"] == "ON"

        commander.send_ac_command("ROM-001", "ON", 22.0)
        assert mock_publish.call_count == 2
        args, _ = mock_publish.call_args
        assert args[0] == "devices/ROM-001/ac"
        assert args[1]["temperature"] == 22.0

        commander.request_status("ROM-001")
        assert mock_publish.call_count == 3
        args, _ = mock_publish.call_args
        assert args[0] == "devices/ROM-001/status/request"


def test_mqtt_commands_error_lookup_behaves_like_physical():
    """If guard lookup errors (returns False), publish proceeds as fallback (preserves legacy behavior)."""
    commander = MQTTCommander()
    with patch("app.mqtt_commands.is_simulated_room", return_value=False), \
         patch("app.mqtt_commands.mqtt_client.publish", return_value=True) as mock_publish:
        commander.send_light_command("ROM-001", 2, "OFF", 10, "Zone 1")
        assert mock_publish.call_count == 1


# ── Schedule Runner Guard Tests ──────────────────────────────────────────────

def test_schedule_runner_simulated_room_blocks_execution():
    runner = ScheduleRunner()
    mock_conn = MagicMock()
    with patch("app.schedule_runner.is_simulated_room", return_value=True), \
         patch("app.schedule_runner.get_db_connection", return_value=mock_conn), \
         patch("app.schedule_runner.mqtt_commander") as mock_commander:
        
        runner._trigger_room_devices("ROM-s01", "ON")

        mock_commander.send_light_command.assert_not_called()
        mock_commander.send_ac_command.assert_not_called()
        mock_conn.cursor.assert_not_called()


def test_schedule_runner_physical_room_executes():
    runner = ScheduleRunner()
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    # device_id, type, relay_channel, zone_id, zone_name
    mock_cur.fetchall.return_value = [
        (1, "esp32", 1, 10, "Zone A"),
        (2, "ac", None, None, None),
    ]
    mock_cur.fetchone.return_value = (22.0,)
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    with patch("app.schedule_runner.is_simulated_room", return_value=False), \
         patch("app.schedule_runner.get_db_connection", return_value=mock_conn), \
         patch("app.schedule_runner.mqtt_commander") as mock_commander, \
         patch.object(runner, "_sync_decision_engine"):
        
        runner._trigger_room_devices("ROM-001", "ON")

        mock_commander.send_light_command.assert_called_once()
        mock_commander.send_ac_command.assert_called_once()


# ── Boot Recovery Guard Tests ────────────────────────────────────────────────

def test_boot_recovery_simulated_room_blocks_restore():
    mock_commander = MagicMock()
    recovery = BootRecoveryManager(mock_commander)
    with patch("app.boot_recovery.is_simulated_room", return_value=True), \
         patch.object(recovery, "_restore_from_schedule") as mock_sched, \
         patch.object(recovery, "_restore_from_db") as mock_db:
        
        recovery.restore_for_room("ROM-s01")

        mock_sched.assert_not_called()
        mock_db.assert_not_called()
        mock_commander.send_light_command.assert_not_called()


def test_boot_recovery_physical_room_restores():
    mock_commander = MagicMock()
    recovery = BootRecoveryManager(mock_commander)
    with patch("app.boot_recovery.is_simulated_room", return_value=False), \
         patch.object(recovery, "_check_active_schedule", return_value=True), \
         patch.object(recovery, "_restore_from_schedule") as mock_sched:
        
        recovery.restore_for_room("ROM-001")
        mock_sched.assert_called_once_with("ROM-001")

