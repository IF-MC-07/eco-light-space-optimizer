import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.inference_realtime import hitung_per_zona
from unittest.mock import MagicMock

class TestInferenceRealtime:
    def test_hitung_per_zona_with_detections(self):
        # Create dummy bounding boxes
        box1 = MagicMock()
        # [x1, y1, x2, y2]
        box1.xyxy = [[100, 100, 200, 200]]  # center 150, 150 (rel: 0.15, 0.15)
        
        box2 = MagicMock()
        box2.xyxy = [[800, 800, 900, 900]]  # center 850, 850 (rel: 0.85, 0.85)

        boxes = [box1, box2]
        
        zones = [
            {"zone_name": "Zone A", "x1_pct": 0.0, "y1_pct": 0.0, "x2_pct": 0.5, "y2_pct": 0.5, "color": "#FF0000"}
        ]
        
        width = 1000
        height = 1000

        result = hitung_per_zona(boxes, zones, width, height)
        
        assert result["Zone A"] == 1
        assert result["luar_zona"] == 1
        assert result["total"] == 2

    def test_hitung_per_zona_empty(self):
        boxes = []
        zones = [
            {"zone_name": "Zone A", "x1_pct": 0.0, "y1_pct": 0.0, "x2_pct": 0.5, "y2_pct": 0.5, "color": "#FF0000"}
        ]
        width = 1000
        height = 1000

        result = hitung_per_zona(boxes, zones, width, height)
        
        assert result["Zone A"] == 0
        assert result["luar_zona"] == 0
        assert result["total"] == 0
