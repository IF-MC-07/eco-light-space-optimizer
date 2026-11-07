"""Pure calculations for room-level occupancy and recommendations.

With the defaults (a 3-cycle median, 2 confirmation cycles, and a 15-second
cycle), a sustained status change is confirmed on the third observed cycle,
about 30 seconds after the first new sample. "Tidak tersedia" is immediate.
"""

import math
from statistics import median_high
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple


EMPTY = "Kosong"
LOW = "Rendah"
MEDIUM = "Sedang"
FULL = "Padat"
UNAVAILABLE = "Tidak tersedia"
CAPACITY_UNCONFIGURED = "Kapasitas belum dikonfigurasi"

DEFAULT_STATUS_SEDANG_MIN_PCT = 40.0
DEFAULT_STATUS_PADAT_MIN_PCT = 75.0

VALID_STATUSES = {
    EMPTY,
    LOW,
    MEDIUM,
    FULL,
    UNAVAILABLE,
    CAPACITY_UNCONFIGURED,
}
RECOMMENDABLE_STATUSES = {EMPTY, LOW, MEDIUM}


def occupancy_percentage(person_count: int, capacity: Optional[int]) -> Optional[float]:
    """Return raw occupancy percent, or None when capacity is not configured."""
    if person_count < 0:
        raise ValueError("person_count must be non-negative")
    if capacity is None or capacity <= 0:
        return None
    return person_count / capacity * 100.0


def available_seats(person_count: int, capacity: Optional[int]) -> Optional[int]:
    """Return remaining seats, or None when capacity is not configured."""
    if person_count < 0:
        raise ValueError("person_count must be non-negative")
    if capacity is None or capacity <= 0:
        return None
    return max(0, capacity - person_count)


def classify_status(
    person_count: int,
    capacity: Optional[int],
    is_stale: bool = False,
    camera_available: bool = True,
    status_sedang_min_pct: float = DEFAULT_STATUS_SEDANG_MIN_PCT,
    status_padat_min_pct: float = DEFAULT_STATUS_PADAT_MIN_PCT,
) -> str:
    """Classify occupancy, applying unavailable/capacity precedence first."""
    if not 0 <= status_sedang_min_pct < status_padat_min_pct:
        raise ValueError("status thresholds must satisfy 0 <= sedang < padat")
    if is_stale or not camera_available:
        return UNAVAILABLE
    if capacity is None or capacity <= 0:
        return CAPACITY_UNCONFIGURED
    if person_count < 0:
        raise ValueError("person_count must be non-negative")
    if person_count == 0:
        return EMPTY

    if person_count * 100 >= status_padat_min_pct * capacity:
        return FULL
    if person_count * 100 >= status_sedang_min_pct * capacity:
        return MEDIUM
    return LOW


def smooth_person_count(
    samples: Sequence[int], window_size: int = 3
) -> int:
    """Return the median of the most recent samples, including zero readings."""
    if window_size <= 0:
        raise ValueError("window_size must be positive")
    if not samples:
        raise ValueError("at least one occupancy sample is required")
    recent = samples[-window_size:]
    if any(sample < 0 for sample in recent):
        raise ValueError("person counts must be non-negative")
    return int(median_high(recent))


def _normalize_building(building: Optional[str]) -> Optional[str]:
    """Normalize a building label for comparison; blank values are unknown."""
    if building is None:
        return None
    normalized = building.strip().casefold()
    return normalized or None


def apply_temporal_persistence(
    confirmed_status: Optional[str],
    candidate_status: str,
    previous_candidate_status: Optional[str] = None,
    previous_candidate_count: int = 0,
    confirm_cycles: int = 2,
) -> Tuple[str, Optional[str], int]:
    """Return confirmed status and candidate state after one classified cycle."""
    if candidate_status not in VALID_STATUSES:
        raise ValueError("candidate_status is not a supported occupancy status")
    if confirmed_status is not None and confirmed_status not in VALID_STATUSES:
        raise ValueError("confirmed_status is not a supported occupancy status")
    if previous_candidate_count < 0:
        raise ValueError("previous_candidate_count must be non-negative")
    if confirm_cycles <= 0:
        raise ValueError("confirm_cycles must be positive")

    if candidate_status == UNAVAILABLE:
        return UNAVAILABLE, None, 0
    if confirmed_status is None or confirmed_status == UNAVAILABLE:
        return candidate_status, None, 0
    if candidate_status == confirmed_status:
        return confirmed_status, None, 0

    count = (
        previous_candidate_count + 1
        if previous_candidate_status == candidate_status
        else 1
    )
    if count >= confirm_cycles:
        return candidate_status, None, 0
    return confirmed_status, candidate_status, count


def select_recommendations(
    origin: Mapping[str, Any],
    rooms: Iterable[Mapping[str, Any]],
    max_recommendations: int = 3,
    include_simulated: bool = True,
) -> List[Dict[str, Any]]:
    """Select fresh, non-full rooms in deterministic building/occupancy order."""
    if max_recommendations < 0:
        raise ValueError("max_recommendations must be non-negative")
    if max_recommendations == 0:
        return []

    origin_id = origin.get("room_id")
    origin_building = _normalize_building(origin.get("building"))
    eligible: List[Tuple[Tuple[Any, ...], Mapping[str, Any], str, float]] = []

    for room in rooms:
        room_id = room.get("room_id")
        status = room.get("status", room.get("confirmed_status"))
        capacity = room.get("capacity")
        percentage = room.get("occupancy_pct_raw", room.get("occupancy_pct"))
        seats = room.get("available_seats")
        simulated = bool(room.get("is_simulated", False))

        if room_id == origin_id or status not in RECOMMENDABLE_STATUSES:
            continue
        if room.get("is_stale", False) or capacity is None or capacity <= 0:
            continue
        if percentage is None or seats is None:
            continue
        if simulated and not include_simulated:
            continue

        building = _normalize_building(room.get("building"))
        if origin_building is None or building is None:
            building_relation = "unknown"
            building_priority = 1
        elif building == origin_building:
            building_relation = "same"
            building_priority = 0
        else:
            building_relation = "different"
            building_priority = 1
        sort_key = (
            building_priority,
            float(percentage),
            -int(seats),
            str(room.get("room_name", "")).casefold(),
            str(room_id),
        )
        eligible.append((sort_key, room, building_relation, float(percentage)))

    eligible.sort(key=lambda item: item[0])
    result: List[Dict[str, Any]] = []
    for _, room, building_relation, raw_percentage in eligible[:max_recommendations]:
        percentage = math.floor(raw_percentage * 10) / 10
        building_reason = {
            "same": "gedung sama",
            "different": "gedung berbeda",
            "unknown": "gedung tidak diketahui",
        }[building_relation]
        result.append(
            {
                "room_id": room["room_id"],
                "room_name": room.get("room_name"),
                "building": room.get("building"),
                "floor": room.get("floor"),
                "occupancy_pct": percentage,
                "available_seats": room["available_seats"],
                "status": room.get("status", room.get("confirmed_status")),
                "is_simulated": bool(room.get("is_simulated", False)),
                "reason": f"{building_reason}, okupansi {percentage:.1f}%",
            }
        )
    return result
