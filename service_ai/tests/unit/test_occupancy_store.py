"""Unit tests for OccupancyStore thread-safety and age calculations."""

import threading
import time
from app.occupancy_store import OccupancyStore, store


def test_record_and_get_count():
    s = OccupancyStore()
    s.record_count("CAM-1", 5)
    res = s.get_count("CAM-1")
    assert res is not None
    total, age = res
    assert total == 5
    assert age >= 0.0
    assert age < 1.0


def test_zero_is_fresh_reading():
    s = OccupancyStore()
    s.record_count("CAM-ZERO", 0)
    res = s.get_count("CAM-ZERO")
    assert res is not None
    total, age = res
    assert total == 0
    assert age < 1.0


def test_unknown_camera_returns_none():
    s = OccupancyStore()
    assert s.get_count("CAM-NONEXISTENT") is None


def test_age_increases_over_time(monkeypatch):
    s = OccupancyStore()
    current_time = 1000.0

    monkeypatch.setattr(time, "monotonic", lambda: current_time)
    s.record_count("CAM-TIME", 12)

    total, age = s.get_count("CAM-TIME")
    assert total == 12
    assert age == 0.0

    current_time += 65.0
    total, age = s.get_count("CAM-TIME")
    assert total == 12
    assert age == 65.0


def test_concurrent_access_multiple_threads():
    s = OccupancyStore()
    num_threads = 10
    iterations = 200

    def writer(cam_id: str):
        for i in range(iterations):
            s.record_count(cam_id, i)

    def reader(cam_id: str):
        for _ in range(iterations):
            _ = s.get_count(cam_id)

    threads = []
    for i in range(num_threads):
        cam = f"CAM-{i % 3}"
        threads.append(threading.Thread(target=writer, args=(cam,)))
        threads.append(threading.Thread(target=reader, args=(cam,)))

    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Verify cameras still have valid counts
    for i in range(3):
        res = s.get_count(f"CAM-{i}")
        assert res is not None
        assert res[0] == iterations - 1

