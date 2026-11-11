"""Unit tests for DSLB engine cycle logic and failure resilience."""

from collections import deque
import logging
from unittest.mock import MagicMock, call
import pytest

from app.dslb_config import DslbConfig
from app.dslb_engine import DslbEngine, run_cycle
from app.occupancy_store import OccupancyStore


class FakeRepo:
    def __init__(self, rooms=None, camera_map=None, sim_counts=None):
        self.rooms = rooms or []
        self.camera_map = camera_map or {}
        self.sim_counts = sim_counts or {}
        self.upserted_rows = []
        self.history_records = []
        self.reco_logs = []
        self.fail_on_upsert = False

    def fetch_rooms(self):
        return self.rooms

    def fetch_active_camera_map(self):
        return self.camera_map

    def fetch_simulated_counts(self):
        return self.sim_counts

    def upsert_current(self, row):
        if self.fail_on_upsert:
            raise RuntimeError("Database upsert failed")
        self.upserted_rows.append(row)

    def insert_history(self, room_id, status, person_count, occupancy_pct_raw, reason="status_change"):
        self.history_records.append((room_id, status, person_count, occupancy_pct_raw, reason))

    def insert_reco_log(self, room_id, recommendations):
        self.reco_logs.append((room_id, recommendations))


def test_run_cycle_normal_room_and_recommendations():
    cfg = DslbConfig(confirm_cycles=1, max_recommendations=2)
    store = OccupancyStore()
    store.record_count("CAM-1", 40)  # Room 1: 40/40 = 100% -> Padat
    store.record_count("CAM-2", 10)  # Room 2: 10/40 = 25% -> Rendah

    repo = FakeRepo(
        rooms=[
            {"room_id": "ROM-1", "room_name": "Room 1", "building": "A", "floor": "1", "capacity": 40, "is_simulated": False},
            {"room_id": "ROM-2", "room_name": "Room 2", "building": "A", "floor": "1", "capacity": 40, "is_simulated": False},
        ],
        camera_map={"ROM-1": "CAM-1", "ROM-2": "CAM-2"},
        sim_counts={},
    )
    state = {}
    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)

    assert len(snapshots) == 2
    r1 = next(s for s in snapshots if s["room_id"] == "ROM-1")
    r2 = next(s for s in snapshots if s["room_id"] == "ROM-2")

    assert r1["confirmed_status"] == "Padat"
    assert len(r1["recommendations"]) == 1
    assert r1["recommendations"][0]["room_id"] == "ROM-2"

    assert r2["confirmed_status"] == "Rendah"
    assert r2["recommendations"] == []

    assert len(repo.upserted_rows) == 2
    assert len(repo.history_records) == 2
    assert len(repo.reco_logs) == 1
    assert repo.reco_logs[0][0] == "ROM-1"


def test_error_in_one_room_does_not_halt_other_rooms():
    cfg = DslbConfig()
    store = OccupancyStore()
    store.record_count("CAM-OK", 5)

    repo = FakeRepo(
        rooms=[
            {"room_id": "ROM-BAD", "room_name": "Broken", "building": "A", "floor": "1", "capacity": "INVALID_CAP", "is_simulated": False},
            {"room_id": "ROM-GOOD", "room_name": "Working", "building": "A", "floor": "1", "capacity": 20, "is_simulated": False},
        ],
        camera_map={"ROM-BAD": "CAM-BAD", "ROM-GOOD": "CAM-OK"},
    )
    state = {}

    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    # ROM-GOOD should still process successfully
    assert any(s["room_id"] == "ROM-GOOD" for s in snapshots)


def test_stale_reading_sets_unavailable_and_resets_buffer():
    cfg = DslbConfig(stale_seconds=50)
    store = OccupancyStore()
    store.record_count("CAM-1", 15)

    repo = FakeRepo(
        rooms=[{"room_id": "ROM-1", "room_name": "Room 1", "building": "A", "floor": "1", "capacity": 30, "is_simulated": False}],
        camera_map={"ROM-1": "CAM-1"},
    )
    state = {}

    # Initial fresh cycle
    run_cycle(repo, store, state, cfg, now_monotonic=10.0)
    assert state["ROM-1"]["confirmed_status"] == "Sedang"
    assert len(state["ROM-1"]["samples"]) > 0

    # Simulate store age being stale (set data with older timestamp)
    store._data["CAM-1"] = (15, 0.0)  # monotonic age at now=100 will be 100 > 50

    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    r1 = snapshots[0]
    assert r1["confirmed_status"] == "Tidak tersedia"
    assert r1["person_count"] is None
    assert r1["available_seats"] is None
    assert len(state["ROM-1"]["samples"]) == 0  # Buffer cleared


def test_simulated_room_reads_from_simulated_counts():
    cfg = DslbConfig(stale_seconds=60)
    store = OccupancyStore()

    repo = FakeRepo(
        rooms=[{"room_id": "ROM-SIM", "room_name": "Sim Room", "building": "B", "floor": "2", "capacity": 20, "is_simulated": True}],
        camera_map={},
        sim_counts={"ROM-SIM": (5, 10.0)},  # count=5, age=10s
    )
    state = {}

    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    r_sim = snapshots[0]
    assert r_sim["is_simulated"] is True
    assert r_sim["confirmed_status"] == "Rendah"
    assert r_sim["person_count"] == 5
    assert r_sim["available_seats"] == 15


def test_capacity_null_or_zero_yields_unconfigured_status():
    cfg = DslbConfig()
    store = OccupancyStore()
    store.record_count("CAM-0", 10)
    store.record_count("CAM-NONE", 10)

    repo = FakeRepo(
        rooms=[
            {"room_id": "ROM-ZERO", "room_name": "Zero Cap", "building": "A", "floor": "1", "capacity": 0, "is_simulated": False},
            {"room_id": "ROM-NULL", "room_name": "Null Cap", "building": "A", "floor": "1", "capacity": None, "is_simulated": False},
        ],
        camera_map={"ROM-ZERO": "CAM-0", "ROM-NULL": "CAM-NONE"},
    )
    state = {}

    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    for s in snapshots:
        assert s["confirmed_status"] == "Kapasitas belum dikonfigurasi"
        assert s["person_count"] is None
        assert s["available_seats"] is None


def test_over_capacity_logs_warning_and_sets_padat(caplog):
    cfg = DslbConfig(confirm_cycles=1)
    store = OccupancyStore()
    store.record_count("CAM-1", 50)  # 50 > 30

    repo = FakeRepo(
        rooms=[{"room_id": "ROM-1", "room_name": "Over Room", "building": "A", "floor": "1", "capacity": 30, "is_simulated": False}],
        camera_map={"ROM-1": "CAM-1"},
    )
    state = {}

    with caplog.at_level(logging.WARNING):
        snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
        assert any("over capacity" in record.message for record in caplog.records)

    r1 = snapshots[0]
    assert r1["confirmed_status"] == "Padat"
    assert r1["person_count"] == 50
    assert r1["available_seats"] == 0


def test_history_recorded_on_status_change_and_heartbeat():
    cfg = DslbConfig(confirm_cycles=1, history_heartbeat_seconds=300)
    store = OccupancyStore()
    store.record_count("CAM-1", 0)

    repo = FakeRepo(
        rooms=[{"room_id": "ROM-1", "room_name": "Room", "building": "A", "floor": "1", "capacity": 20, "is_simulated": False}],
        camera_map={"ROM-1": "CAM-1"},
    )
    state = {}

    # Cycle 1: Status "Kosong" (initial status change)
    run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    assert len(repo.history_records) == 1
    assert repo.history_records[0][4] == "status_change"

    # Cycle 2: Status still "Kosong", heartbeat not reached
    run_cycle(repo, store, state, cfg, now_monotonic=200.0)
    assert len(repo.history_records) == 1

    # Cycle 3: 300s passed -> heartbeat record triggered
    run_cycle(repo, store, state, cfg, now_monotonic=401.0)
    assert len(repo.history_records) == 2
    assert repo.history_records[1][4] == "heartbeat"


def test_recommendation_log_dedup_and_min_interval():
    cfg = DslbConfig(confirm_cycles=1, reco_log_min_interval_seconds=300)
    store = OccupancyStore()
    store.record_count("CAM-1", 30)  # Padat
    store.record_count("CAM-2", 2)   # Rendah

    repo = FakeRepo(
        rooms=[
            {"room_id": "ROM-1", "room_name": "R1", "building": "A", "floor": "1", "capacity": 30, "is_simulated": False},
            {"room_id": "ROM-2", "room_name": "R2", "building": "A", "floor": "1", "capacity": 30, "is_simulated": False},
        ],
        camera_map={"ROM-1": "CAM-1", "ROM-2": "CAM-2"},
    )
    state = {}

    # Cycle 1: initial reco log
    run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    assert len(repo.reco_logs) == 1

    # Cycle 2: identical recommendations, must not log again
    run_cycle(repo, store, state, cfg, now_monotonic=200.0)
    assert len(repo.reco_logs) == 1


def test_repo_releases_connection_on_success_and_error():
    from app.dslb_repository import DslbRepository

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_cursor.fetchall.return_value = []

    mock_get = MagicMock(return_value=mock_conn)
    mock_release = MagicMock()

    repo = DslbRepository(get_conn_fn=mock_get, release_conn_fn=mock_release)

    # Success path
    repo.fetch_rooms()
    assert mock_release.called
    assert mock_release.call_args[0][0] == mock_conn

    # Error path
    mock_release.reset_mock()
    mock_cursor.execute.side_effect = RuntimeError("DB Query Failure")
    with pytest.raises(RuntimeError):
        repo.fetch_rooms()
    assert mock_release.called
    assert mock_release.call_args[0][0] == mock_conn


def test_engine_thread_resilience_on_db_failure(monkeypatch):
    import time

    cfg = DslbConfig(cycle_seconds=1)
    store = OccupancyStore()
    repo = FakeRepo()
    engine = DslbEngine(config=cfg, repository=repo, store=store)

    call_count = 0

    def failing_cycle(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        raise RuntimeError("Transient DB Connection Down")

    monkeypatch.setattr("app.dslb_engine.run_cycle", failing_cycle)

    engine.start()
    time.sleep(0.15)
    # Thread must still be alive despite exceptions
    assert engine._thread.is_alive()
    assert call_count >= 1
    engine.stop()
