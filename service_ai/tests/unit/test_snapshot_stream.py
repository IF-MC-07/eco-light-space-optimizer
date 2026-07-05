import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app import snapshot


client = TestClient(snapshot.app)


def test_stream_returns_503_when_no_initial_frame_exists(monkeypatch):
    async def fake_wait_first_frame(camera_id, timeout=None):
        return None

    monkeypatch.setattr(snapshot, "_wait_first_frame", fake_wait_first_frame)
    monkeypatch.setattr(snapshot, "get_latest_frame", lambda camera_id: None)

    response = client.get("/kamera/cam1/stream")

    assert response.status_code == 503
    assert response.json() == {"detail": "Belum ada frame dari worker"}
