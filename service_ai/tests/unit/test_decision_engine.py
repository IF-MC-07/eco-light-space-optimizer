import pytest
import time
import psycopg2
from unittest.mock import patch, MagicMock

# Import necessary module. Path should match the project setup.
# Note: we need to ensure app can be imported.
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.decision_engine import DecisionEngine

class TestDecisionEngine:
    @pytest.fixture
    def engine(self):
        with patch.dict(os.environ, {
            "DELAY_ON_LIGHT_SECONDS": "5",
            "DELAY_ON_AC_MINUTES": "1",  # 60 seconds
            "DELAY_OFF_MINUTES": "1",    # 60 seconds
            "COMPRESSOR_PROTECTION_SECONDS": "180"
        }):
            return DecisionEngine()

    @pytest.fixture
    def mock_db_connection(self, monkeypatch):
        import app.decision_engine as decision_engine_module

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        monkeypatch.setattr(decision_engine_module, 'get_db_connection', lambda: mock_conn)
        return mock_cur

    @pytest.fixture
    def mock_mqtt(self, monkeypatch):
        import app.decision_engine as decision_engine_module

        mock_mqtt = MagicMock()
        monkeypatch.setattr(decision_engine_module, 'mqtt_commander', mock_mqtt)
        return mock_mqtt

    def test_initialize_camera_states(self, engine, mock_db_connection):
        # Setup mock return values for DB
        # 1. Fetch Room ID
        mock_db_connection.fetchone.side_effect = [
            (1,), # Room ID
            ("OFF",) # AC Control state
        ]
        # 2. Fetch Active Zones
        mock_db_connection.fetchall.return_value = [
            (10, "ZoneA", "OFF"),
            (11, "ZoneB", "ON")
        ]

        engine._initialize_camera_states("cam_1")

        assert engine._camera_room_cache["cam_1"] == 1
        assert 10 in engine.zone_states
        assert engine.zone_states[10]["current_status"] == "OFF"
        assert engine.zone_states[11]["current_status"] == "ON"
        assert 1 in engine.ac_states
        assert engine.ac_states[1]["current_status"] == "OFF"
        assert "cam_1" in engine._initialized_cameras

        # Calling again should not hit DB
        engine._initialize_camera_states("cam_1")
        assert mock_db_connection.fetchone.call_count == 2 # Only called during first init

    @patch('app.decision_engine.time.time')
    def test_process_inference_light_turn_on(self, mock_time, engine, mock_db_connection, mock_mqtt):
        # Manually inject state
        engine._camera_room_cache["cam_1"] = 1
        engine.zone_states = {
            10: {"zone_id": 10, "zone_name": "ZoneA", "room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "pending_on": False, "pending_off": False}
        }
        engine.ac_states = {
            1: {"room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "last_turned_off": None}
        }
        engine._initialized_cameras.add("cam_1")

        # Relay channel query
        mock_db_connection.fetchone.return_value = (1,) 

        mock_time.return_value = 100.0

        # Cycle 1: Occupied detected, pending on
        engine.process_inference("cam_1", {"ZoneA": 1})
        assert engine.zone_states[10]["pending_on"] == True
        assert engine.zone_states[10]["occupied_since"] == 100.0
        assert mock_mqtt.send_light_command.call_count == 0

        # Cycle 2: 5 seconds passed (DELAY_ON_LIGHT_SECONDS)
        mock_time.return_value = 105.0
        engine.process_inference("cam_1", {"ZoneA": 2})

        mock_mqtt.send_light_command.assert_called_once_with(
            room_id=1, relay_channel=1, command="ON", zone_id=10, zone_name="ZoneA", source="ai_decision"
        )
        assert engine.zone_states[10]["current_status"] == "ON"
        assert engine.zone_states[10]["pending_on"] == False

    @patch('app.decision_engine.time.time')
    def test_process_inference_light_turn_off(self, mock_time, engine, mock_db_connection, mock_mqtt):
        engine._camera_room_cache["cam_1"] = 1
        engine.zone_states = {
            10: {"zone_id": 10, "zone_name": "ZoneA", "room_id": 1, "current_status": "ON", "occupied_since": None, "empty_since": None, "pending_on": False, "pending_off": False}
        }
        engine.ac_states = {}
        engine._initialized_cameras.add("cam_1")

        mock_db_connection.fetchone.return_value = (1,) 

        mock_time.return_value = 100.0

        # Empty detected
        engine.process_inference("cam_1", {"ZoneA": 0})
        assert engine.zone_states[10]["pending_off"] == True
        assert engine.zone_states[10]["empty_since"] == 100.0

        # Advance 60 seconds (DELAY_OFF_MINUTES)
        mock_time.return_value = 160.0
        engine.process_inference("cam_1", {"ZoneA": 0})

        mock_mqtt.send_light_command.assert_called_once_with(
            room_id=1, relay_channel=1, command="OFF", zone_id=10, zone_name="ZoneA", source="ai_decision"
        )
        assert engine.zone_states[10]["current_status"] == "OFF"

    @patch('app.decision_engine.time.time')
    def test_compressor_protection_active(self, mock_time, engine, mock_db_connection, mock_mqtt):
        engine._camera_room_cache["cam_1"] = 1
        engine.zone_states = {
            10: {"zone_id": 10, "zone_name": "ZoneA", "room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "pending_on": False, "pending_off": False}
        }
        # Last turned off was at t=0
        engine.ac_states = {
            1: {"room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "last_turned_off": 0.0}
        }
        engine._initialized_cameras.add("cam_1")

        # Delay AC is 60s, Compressor is 180s
        mock_time.return_value = 60.0
        
        # Occupied
        engine.process_inference("cam_1", {"ZoneA": 1})
        assert engine.ac_states[1]["occupied_since"] == 60.0

        # Advance to t=120. AC delay (60s) met, but compressor protection (180s) from last_turned_off (0) is NOT met yet (120 < 180)
        mock_time.return_value = 120.0
        engine.process_inference("cam_1", {"ZoneA": 1})

        # AC command should NOT be sent
        assert mock_mqtt.send_ac_command.call_count == 0

        # Advance to t=181. Compressor protection released
        mock_time.return_value = 181.0
        # return temp
        mock_db_connection.fetchone.return_value = (24.0,) 
        engine.process_inference("cam_1", {"ZoneA": 1})

        mock_mqtt.send_ac_command.assert_called_once_with(
            room_id=1, command="ON", temperature=24.0, source="ai_decision"
        )
        assert engine.ac_states[1]["current_status"] == "ON"

    @patch('app.decision_engine.time.time')
    def test_process_inference_recovers_from_closed_cursor(self, mock_time, engine, monkeypatch, mock_mqtt):
        engine._camera_room_cache["cam_1"] = 1
        engine.zone_states = {
            10: {"zone_id": 10, "zone_name": "ZoneA", "room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "pending_on": False, "pending_off": False}
        }
        engine.ac_states = {
            1: {"room_id": 1, "current_status": "OFF", "occupied_since": None, "empty_since": None, "last_turned_off": None}
        }
        engine._initialized_cameras.add("cam_1")

        import app.decision_engine as decision_engine_module

        init_conn = MagicMock()
        init_cursor = MagicMock()
        init_conn.cursor.return_value.__enter__.return_value = init_cursor
        init_cursor.fetchone.return_value = (1,)
        init_cursor.fetchall.return_value = []

        first_conn = MagicMock()
        second_conn = MagicMock()
        first_cursor = MagicMock()
        second_cursor = MagicMock()

        first_conn.cursor.return_value.__enter__.return_value = first_cursor
        second_conn.cursor.return_value.__enter__.return_value = second_cursor
        second_cursor.fetchone.return_value = (1,)
        second_cursor.fetchall.return_value = []

        first_cursor.execute.side_effect = psycopg2.ProgrammingError("cursor already closed")

        connection_sequence = [init_conn, first_conn, second_conn]
        monkeypatch.setattr(decision_engine_module, 'get_db_connection', lambda: connection_sequence.pop(0))

        mock_time.return_value = 105.0
        engine.process_inference("cam_1", {"ZoneA": 2})

        mock_mqtt.send_light_command.assert_not_called()

        mock_time.return_value = 110.0
        engine.process_inference("cam_1", {"ZoneA": 2})

        mock_mqtt.send_light_command.assert_called_once_with(
            room_id=1, relay_channel=1, command="ON", zone_id=10, zone_name="ZoneA", source="ai_decision"
        )
