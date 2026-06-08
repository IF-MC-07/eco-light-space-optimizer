import pytest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.inference_realtime import hitung_per_zona

class TestInferenceRealtime:
    @patch('app.inference_realtime.cv2')
    @patch('app.inference_realtime.model')
    @patch('app.inference_realtime.os.getenv')
    def test_hitung_per_zona_flags(self, mock_getenv, mock_model, mock_cv2):
        # Create a dummy frame and setup model mock
        frame = MagicMock()
        mock_result = MagicMock()
        mock_result.boxes = []
        mock_model.predict.return_value = [mock_result]
        
        # Test default (DEBUG_MODE=False)
        mock_getenv.return_value = "False"

        zones = []
        hitung_per_zona("cam1", frame, zones)

        # Ensure correct flags are passed to predict
        mock_model.predict.assert_called_with(
            frame, conf=0.20, classes=[0], save=False, save_txt=False, save_crop=False, verbose=False
        )

        # Ensure imshow is NOT called
        mock_cv2.imshow.assert_not_called()

    @patch('app.inference_realtime.cv2')
    @patch('app.inference_realtime.model')
    @patch('app.inference_realtime.os.getenv')
    def test_hitung_per_zona_debug_true(self, mock_getenv, mock_model, mock_cv2):
        frame = MagicMock()
        mock_result = MagicMock()
        mock_result.plot.return_value = frame
        mock_result.boxes = []
        mock_model.predict.return_value = [mock_result]
        
        # Test DEBUG_MODE=True
        mock_getenv.side_effect = lambda key, default=None: "True" if key == "DEBUG_MODE" else default

        zones = []
        hitung_per_zona("cam1", frame, zones)

        # Ensure imshow IS called
        mock_cv2.imshow.assert_called()
        mock_cv2.waitKey.assert_called()
