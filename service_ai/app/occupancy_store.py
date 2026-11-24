"""Thread-safe in-memory store for camera occupancy counts."""

import threading
import time
from typing import Dict, Optional, Tuple


class OccupancyStore:
    """Thread-safe in-memory store mapping camera_id to latest occupancy reading."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._data: Dict[str, Tuple[int, float]] = {}

    def record_count(self, camera_id: str, total: int) -> None:
        """Record occupancy count for a camera.
        
        0 is treated as a valid fresh reading, not 'no data'.
        """
        if not camera_id:
            return
        now = time.monotonic()
        with self._lock:
            self._data[camera_id] = (int(total), now)

    def get_count(self, camera_id: str) -> Optional[Tuple[int, float]]:
        """Return (total, age_seconds) or None if camera has no recorded count."""
        now = time.monotonic()
        with self._lock:
            item = self._data.get(camera_id)
            if item is None:
                return None
            total, timestamp = item
            age_seconds = max(0.0, now - timestamp)
            return total, age_seconds

    def clear(self) -> None:
        """Clear all recorded counts."""
        with self._lock:
            self._data.clear()


# Module-level singleton instance shared by camera_worker hook and dslb_engine
store = OccupancyStore()


def record_count(camera_id: str, total: int) -> None:
    """Convenience module function for record_count."""
    store.record_count(camera_id, total)


def get_count(camera_id: str) -> Optional[Tuple[int, float]]:
    """Convenience module function for get_count."""
    return store.get_count(camera_id)

