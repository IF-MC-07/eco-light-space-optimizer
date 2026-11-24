"""DSLB (Dynamic Space Load Balancing) Engine.

Executes periodic occupancy classification, temporal smoothing, history recording,
and alternative room recommendations.

State loss on restart:
In-memory smoothing window and candidate persistence state are reset on restart.
By design (via dslb_core.apply_temporal_persistence), the first valid classified sample
after restart or recovery is adopted immediately without requiring confirmation cycles.
"""

from collections import deque
import logging
import threading
import time
from typing import Any, Dict, List, Optional

try:
    from app.dslb_config import DslbConfig
    from app.dslb_core import (
        CAPACITY_UNCONFIGURED,
        EMPTY,
        FULL,
        LOW,
        MEDIUM,
        UNAVAILABLE,
        apply_temporal_persistence,
        available_seats,
        classify_status,
        occupancy_percentage,
        select_recommendations,
        smooth_person_count,
    )
    from app.dslb_repository import DslbRepository
    from app.occupancy_store import OccupancyStore, store as global_store
except ImportError:
    from dslb_config import DslbConfig
    from dslb_core import (
        CAPACITY_UNCONFIGURED,
        EMPTY,
        FULL,
        LOW,
        MEDIUM,
        UNAVAILABLE,
        apply_temporal_persistence,
        available_seats,
        classify_status,
        occupancy_percentage,
        select_recommendations,
        smooth_person_count,
    )
    from dslb_repository import DslbRepository
    from occupancy_store import OccupancyStore, store as global_store

logger = logging.getLogger(__name__)


def _init_room_state(smoothing_window: int) -> Dict[str, Any]:
    return {
        "samples": deque(maxlen=smoothing_window),
        "confirmed_status": None,
        "candidate_status": None,
        "candidate_count": 0,
        "last_history_time": 0.0,
        "last_history_status": None,
        "last_reco_log_time": 0.0,
        "last_reco_room_ids": None,
        "over_capacity_logged": False,
    }


def run_cycle(
    repo: Any,
    store: OccupancyStore,
    state: Dict[str, Dict[str, Any]],
    cfg: DslbConfig,
    now_monotonic: float,
) -> List[Dict[str, Any]]:
    """Execute one complete DSLB evaluation cycle across all active rooms.
    
    Pure logic separated from the loop thread to enable deterministic testing.
    """
    rooms = repo.fetch_rooms()
    camera_map = repo.fetch_active_camera_map()
    sim_counts = repo.fetch_simulated_counts()

    evaluated_snapshots: List[Dict[str, Any]] = []

    for room in rooms:
        room_id = room["room_id"]
        if room_id not in state:
            state[room_id] = _init_room_state(cfg.smoothing_window)
        r_state = state[room_id]

        try:
            is_simulated = room.get("is_simulated", False)
            camera_available = True
            is_stale = False
            raw_count = 0

            if is_simulated:
                sim_data = sim_counts.get(room_id)
                if sim_data is None:
                    camera_available = False
                else:
                    raw_count, age = sim_data
                    if age > cfg.stale_seconds:
                        is_stale = True
            else:
                cam_id = camera_map.get(room_id)
                if not cam_id:
                    camera_available = False
                else:
                    reading = store.get_count(cam_id)
                    if reading is None:
                        camera_available = False
                    else:
                        raw_count, age = reading
                        if age > cfg.stale_seconds:
                            is_stale = True

            capacity = room.get("capacity")
            if capacity is not None and int(capacity) <= 0:
                capacity = None

            if not camera_available or is_stale:
                r_state["samples"].clear()
                classified = UNAVAILABLE
                confirmed, candidate, count = apply_temporal_persistence(
                    r_state["confirmed_status"],
                    classified,
                    r_state["candidate_status"],
                    r_state["candidate_count"],
                    cfg.confirm_cycles,
                )
                r_state["over_capacity_logged"] = False
                final_person_count = None
                final_occupancy_pct = None
                final_seats = None
            else:
                r_state["samples"].append(raw_count)
                samples_list = list(r_state["samples"])
                smoothed = smooth_person_count(samples_list, cfg.smoothing_window)

                if capacity is not None and smoothed > capacity:
                    if not r_state["over_capacity_logged"]:
                        logger.warning(
                            f"⚠️ Room {room_id} ({room.get('room_name')}) over capacity: "
                            f"{smoothed} persons > capacity {capacity}"
                        )
                        r_state["over_capacity_logged"] = True
                else:
                    r_state["over_capacity_logged"] = False

                classified = classify_status(
                    smoothed,
                    capacity,
                    is_stale=False,
                    camera_available=True,
                    status_sedang_min_pct=cfg.status_sedang_min_pct,
                    status_padat_min_pct=cfg.status_padat_min_pct,
                )

                confirmed, candidate, count = apply_temporal_persistence(
                    r_state["confirmed_status"],
                    classified,
                    r_state["candidate_status"],
                    r_state["candidate_count"],
                    cfg.confirm_cycles,
                )

                if confirmed in (UNAVAILABLE, CAPACITY_UNCONFIGURED):
                    final_person_count = None
                    final_occupancy_pct = None
                    final_seats = None
                else:
                    final_person_count = smoothed
                    final_occupancy_pct = occupancy_percentage(smoothed, capacity)
                    final_seats = available_seats(smoothed, capacity)

            if r_state["confirmed_status"] != confirmed:
                logger.info(
                    f"ℹ️ Room {room_id} status changed: {r_state['confirmed_status']} -> {confirmed}"
                )

            r_state["confirmed_status"] = confirmed
            r_state["candidate_status"] = candidate
            r_state["candidate_count"] = count

            evaluated_snapshots.append(
                {
                    "room_id": room_id,
                    "room_name": room.get("room_name"),
                    "building": room.get("building"),
                    "floor": room.get("floor"),
                    "capacity": capacity,
                    "status": confirmed,
                    "confirmed_status": confirmed,
                    "candidate_status": candidate,
                    "candidate_count": count,
                    "person_count": final_person_count,
                    "occupancy_pct_raw": final_occupancy_pct,
                    "available_seats": final_seats,
                    "is_stale": is_stale or not camera_available,
                    "is_simulated": is_simulated,
                    "recommendations": [],
                }
            )
        except Exception as e:
            logger.error(f"❌ Error processing room {room_id}: {e}", exc_info=True)

    # Recommendations step for Padat rooms
    for snap in evaluated_snapshots:
        if snap["confirmed_status"] == FULL:
            recos = select_recommendations(
                snap, evaluated_snapshots, cfg.max_recommendations, cfg.include_simulated
            )
            snap["recommendations"] = recos
        else:
            snap["recommendations"] = []

    # Persistence step (upsert current, record history, log recommendations)
    for snap in evaluated_snapshots:
        room_id = snap["room_id"]
        r_state = state[room_id]
        status = snap["confirmed_status"]

        try:
            repo.upsert_current(snap)

            # History recording
            status_changed = r_state.get("last_history_status") != status
            heartbeat_due = (
                now_monotonic - r_state.get("last_history_time", 0.0)
            ) >= cfg.history_heartbeat_seconds

            if status_changed or heartbeat_due:
                reason = "status_change" if status_changed else "heartbeat"
                repo.insert_history(
                    room_id,
                    status,
                    snap["person_count"],
                    snap["occupancy_pct_raw"],
                    reason=reason,
                )
                r_state["last_history_time"] = now_monotonic
                r_state["last_history_status"] = status

            # Recommendation logging
            if status == FULL:
                reco_ids = [r["room_id"] for r in snap["recommendations"]]
                reco_changed = r_state.get("last_reco_room_ids") != reco_ids
                interval_passed = (
                    now_monotonic - r_state.get("last_reco_log_time", 0.0)
                ) >= cfg.reco_log_min_interval_seconds

                if reco_changed and (r_state.get("last_reco_room_ids") is None or interval_passed):
                    repo.insert_reco_log(room_id, snap["recommendations"])
                    r_state["last_reco_room_ids"] = reco_ids
                    r_state["last_reco_log_time"] = now_monotonic
            else:
                r_state["last_reco_room_ids"] = None
                r_state["last_reco_log_time"] = 0.0
        except Exception as e:
            logger.error(f"❌ Error persisting DSLB data for room {room_id}: {e}", exc_info=True)

    return evaluated_snapshots


class DslbEngine:
    """Daemon runner executing the DSLB cycle periodically."""

    def __init__(
        self,
        config: Optional[DslbConfig] = None,
        repository: Optional[DslbRepository] = None,
        store: Optional[OccupancyStore] = None,
    ) -> None:
        self.cfg = config or DslbConfig.from_env()
        self.repo = repository or DslbRepository()
        self.store = store or global_store

        self.state: Dict[str, Dict[str, Any]] = {}
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

    def start(self) -> None:
        """Start the DSLB engine background daemon thread."""
        with self._lock:
            if self._thread is not None and self._thread.is_alive():
                logger.warning("DSLB Engine thread already running. Skipping start.")
                return

            self._stop_event.clear()
            self._thread = threading.Thread(
                target=self._run_loop, name="DslbEngineThread", daemon=True
            )
            self._thread.start()
            logger.info("🚀 DSLB Engine daemon thread started.")

    def stop(self) -> None:
        """Signal the DSLB engine to stop and join thread."""
        with self._lock:
            self._stop_event.set()
            if self._thread and self._thread.is_alive():
                self._thread.join(timeout=5.0)
                logger.info("DSLB Engine daemon thread stopped.")
                self._thread = None

    def _run_loop(self) -> None:
        backoff = float(self.cfg.cycle_seconds)
        failure_count = 0

        while not self._stop_event.is_set():
            start_time = time.monotonic()
            try:
                run_cycle(self.repo, self.store, self.state, self.cfg, start_time)

                duration = time.monotonic() - start_time
                if duration > self.cfg.cycle_seconds:
                    logger.warning(
                        f"⚠️ DSLB cycle exceeded interval: {duration:.2f}s > {self.cfg.cycle_seconds}s"
                    )
                else:
                    logger.debug(f"DSLB cycle completed in {duration:.3f}s")

                backoff = float(self.cfg.cycle_seconds)
                failure_count = 0

                elapsed = time.monotonic() - start_time
                sleep_time = max(0.0, self.cfg.cycle_seconds - elapsed)
                if sleep_time > 0 and self._stop_event.wait(sleep_time):
                    break
            except Exception as e:
                failure_count += 1
                if failure_count == 1 or failure_count % 10 == 0:
                    logger.warning(
                        f"⚠️ DSLB DB failure (#{failure_count}): {e}. Backing off {backoff:.1f}s."
                    )
                if self._stop_event.wait(backoff):
                    break
                backoff = min(300.0, backoff * 2.0)
