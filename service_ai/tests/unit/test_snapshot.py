import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import numpy as np

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# We need to mock YOLO and cv2 before importing snapshot to prevent model loading
with patch('app.snapshot.YOLO') as mock_yolo, patch('cv2.VideoCapture') as mock_vc:
    from app.snapshot import app, process_frame, take_snapshot

client = TestClient(app)

class TestSnapshotAPI:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, mocker):
        # Mocking external DB and CV dependencies
        self.mock_get_kamera_ip = mocker.patch('app.snapshot.get_kamera_ip', return_value="0")
        self.mock_ambil_zona_dari_db = mocker.patch('app.snapshot.ambil_zona_dari_db', return_value=[])
        self.mock_cap = MagicMock()
        self.mock_videocapture = mocker.patch('app.snapshot.cv2.VideoCapture', return_value=self.mock_cap)
        self.mock_imencode = mocker.patch('app.snapshot.cv2.imencode', return_value=(True, np.array([1, 2, 3])))
        
        # Mock process_frame so we don't run YOLO logic during endpoint tests
        self.mock_process_frame = mocker.patch('app.snapshot.process_frame', return_value=np.zeros((100, 100, 3), dtype=np.uint8))

    def test_get_snapshot_success(self):
        self.mock_cap.isOpened.return_value = True
        self.mock_cap.read.return_value = (True, np.zeros((100, 100, 3), dtype=np.uint8))

        response = client.get("/kamera/cam1/snapshot")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"
        self.mock_cap.release.assert_called_once()
        self.mock_process_frame.assert_called_once()
        self.mock_imencode.assert_called_once()

    def test_get_snapshot_camera_not_opened(self):
        self.mock_cap.isOpened.return_value = False

        response = client.get("/kamera/cam1/snapshot")
        
        assert response.status_code == 503
        assert response.json() == {"detail": "Kamera tidak dapat diakses"}

    def test_get_snapshot_cannot_read_frame(self):
        self.mock_cap.isOpened.return_value = True
        self.mock_cap.read.return_value = (False, None)

        response = client.get("/kamera/cam1/snapshot")
        
        assert response.status_code == 503
        assert response.json() == {"detail": "Cannot capture frame"}
        self.mock_cap.release.assert_called_once()

    def test_api_realtime_stats(self, mocker):
        mock_stats = mocker.patch('app.snapshot.get_realtime_stats', return_value={"status": "ok"})
        response = client.get("/stats/realtime")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        mock_stats.assert_called_once_with(None)

class TestProcessFrame:
    @patch('app.snapshot.model')
    @patch('app.snapshot.cv2')
    def test_process_frame_logic(self, mock_cv2, mock_model):
        # Create a dummy frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Mock YOLO results
        mock_result = MagicMock()
        mock_result.plot.return_value = frame.copy()
        mock_box = MagicMock()
        # [x1, y1, x2, y2]
        mock_box.xyxy = [[320, 240, 400, 300]] 
        mock_result.boxes = [mock_box]
        
        mock_model.predict.return_value = [mock_result]

        zones = [
            {"zone_name": "Zone A", "x1_pct": 0.0, "y1_pct": 0.0, "x2_pct": 1.0, "y2_pct": 1.0, "color": "#FF0000"}
        ]

        with patch('app.snapshot.titik_di_zona', return_value=True):
            annotated = process_frame(frame, "cam1", zones)
            
            # Verifications
            assert annotated is not None
            mock_model.predict.assert_called_once()
            # cv2.rectangle should be called to draw the zone
            mock_cv2.rectangle.assert_called()
            mock_cv2.putText.assert_called()

    def test_take_snapshot_fallback(self, capsys):
        take_snapshot()
        captured = capsys.readouterr()
        assert "take_snapshot trigger invoked!" in captured.out
