import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import numpy as np
import io

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.snapshot import app, take_snapshot

client = TestClient(app)

class TestSnapshotAPI:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        # Mock get_latest_frame for test purposes
        self.mock_get_latest_frame = mocker.patch('app.snapshot.get_latest_frame')
        
        # Override the timeout and interval so tests run fast
        mocker.patch('app.snapshot.WAIT_FOR_FIRST_FRAME_TIMEOUT', 0.1)
        mocker.patch('app.snapshot.STREAM_POLL_INTERVAL', 0.01)

    def test_get_snapshot_success(self, mocker):
        # Setup mock frame data
        dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)
        self.mock_get_latest_frame.return_value = {
            "timestamp": 1234567890.0,
            "frame": dummy_frame,
            "annotated": dummy_frame
        }
        
        mock_imencode = mocker.patch('app.snapshot.cv2.imencode', return_value=(True, np.array([1, 2, 3])))

        response = client.get("/kamera/cam1/snapshot")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"
        mock_imencode.assert_called_once()

    def test_get_snapshot_timeout(self):
        # Simulate camera not sending any frames
        self.mock_get_latest_frame.return_value = None

        response = client.get("/kamera/cam1/snapshot")
        
        assert response.status_code == 503
        assert response.json() == {"detail": "Belum ada frame dari worker, kamera mungkin belum aktif"}

    def test_api_realtime_stats(self, mocker):
        mock_stats = mocker.patch('app.snapshot.get_realtime_stats', return_value={"status": "ok"})
        response = client.get("/stats/realtime")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_stats.assert_called_once_with(None)

    def test_take_snapshot_fallback(self, capsys):
        take_snapshot()
        captured = capsys.readouterr()
        assert "take_snapshot trigger invoked!" in captured.out
