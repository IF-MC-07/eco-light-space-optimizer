import pytest

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


@pytest.mark.parametrize(
    ("people", "capacity", "expected"),
    [
        (0, 100, EMPTY),
        (1, 1000, LOW),
        (39, 100, LOW),
        (399, 1000, LOW),
        (29, 100, LOW),
        (40, 100, MEDIUM),
        (74, 100, MEDIUM),
        (749, 1000, MEDIUM),
        (75, 100, FULL),
        (100, 100, FULL),
        (101, 100, FULL),
        (0, 0, CAPACITY_UNCONFIGURED),
        (5, None, CAPACITY_UNCONFIGURED),
    ],
)
def test_classify_status_boundaries(people, capacity, expected):
    assert classify_status(people, capacity) == expected


def test_classify_status_uses_configured_integer_threshold_comparisons():
    assert classify_status(
        29, 100, status_sedang_min_pct=29, status_padat_min_pct=70
    ) == MEDIUM
    assert classify_status(
        59, 200, status_sedang_min_pct=29.5, status_padat_min_pct=70
    ) == MEDIUM


def test_unavailable_precedes_unconfigured_capacity():
    assert classify_status(2, None, is_stale=True) == UNAVAILABLE
    assert classify_status(2, 100, camera_available=False) == UNAVAILABLE


def test_occupancy_percentage_keeps_raw_value_above_capacity():
    assert occupancy_percentage(125, 100) == 125.0
    assert available_seats(125, 100) == 0
    assert occupancy_percentage(3, 0) is None
    assert available_seats(3, None) is None


def test_smoothing_uses_median_and_preserves_zero_samples():
    assert smooth_person_count([0, 8, 1], window_size=3) == 1
    assert smooth_person_count([4, 0], window_size=3) == 4
    assert smooth_person_count([9, 2, 1, 7], window_size=3) == 2
    assert isinstance(smooth_person_count([0, 8, 1], window_size=3), int)


def test_smoothing_median_high_for_even_window_and_single_sample():
    assert smooth_person_count([1, 4], window_size=2) == 4
    assert smooth_person_count([6], window_size=3) == 6


def test_temporal_persistence_waits_for_consecutive_cycles():
    confirmed, candidate, count = apply_temporal_persistence(
        LOW, MEDIUM, confirm_cycles=2
    )
    assert (confirmed, candidate, count) == (LOW, MEDIUM, 1)

    confirmed, candidate, count = apply_temporal_persistence(
        confirmed, MEDIUM, candidate, count, confirm_cycles=2
    )
    assert (confirmed, candidate, count) == (MEDIUM, None, 0)


def test_temporal_persistence_resets_candidate_after_a_blink():
    confirmed, candidate, count = apply_temporal_persistence(
        LOW, MEDIUM, confirm_cycles=3
    )
    assert (confirmed, candidate, count) == (LOW, MEDIUM, 1)
    confirmed, candidate, count = apply_temporal_persistence(
        confirmed, LOW, candidate, count, confirm_cycles=3
    )
    assert (confirmed, candidate, count) == (LOW, None, 0)
    assert apply_temporal_persistence(
        confirmed, MEDIUM, candidate, count, confirm_cycles=3
    ) == (LOW, MEDIUM, 1)


def test_unavailable_applies_immediately_and_first_valid_sample_recovers():
    assert apply_temporal_persistence(LOW, UNAVAILABLE) == (UNAVAILABLE, None, 0)
    assert apply_temporal_persistence(UNAVAILABLE, EMPTY) == (EMPTY, None, 0)
    assert apply_temporal_persistence(None, LOW) == (LOW, None, 0)


def test_recommendations_prioritize_same_building_then_stable_ties():
    origin = {"room_id": "origin", "building": "A"}
    rooms = [
        {
            "room_id": "other-building",
            "room_name": "A Room",
            "building": "B",
            "status": LOW,
            "capacity": 100,
            "occupancy_pct_raw": 5,
            "available_seats": 95,
        },
        {
            "room_id": "same-b",
            "room_name": "B Room",
            "building": "A",
            "status": MEDIUM,
            "capacity": 100,
            "occupancy_pct_raw": 20,
            "available_seats": 80,
        },
        {
            "room_id": "same-a",
            "room_name": "A Room",
            "building": "A",
            "status": LOW,
            "capacity": 100,
            "occupancy_pct_raw": 20,
            "available_seats": 80,
        },
        {
            "room_id": "null-building",
            "room_name": "No Building",
            "building": None,
            "status": LOW,
            "capacity": 100,
            "occupancy_pct_raw": 1,
            "available_seats": 99,
        },
    ]

    selected = select_recommendations(origin, rooms, max_recommendations=4)

    assert [room["room_id"] for room in selected] == [
        "same-a",
        "same-b",
        "null-building",
        "other-building",
    ]
    assert selected[0]["reason"] == "gedung sama, okupansi 20.0%"
    assert selected[2]["reason"] == "gedung tidak diketahui, okupansi 1.0%"
    assert selected[3]["reason"] == "gedung berbeda, okupansi 5.0%"


def test_recommendations_normalize_building_names_for_matching():
    origin = {"room_id": "origin", "building": "  Gedung A "}
    room = {
        "room_id": "candidate",
        "room_name": "Room",
        "building": "gedung a",
        "status": LOW,
        "capacity": 100,
        "occupancy_pct_raw": 20,
        "available_seats": 80,
    }

    selected = select_recommendations(origin, [room])

    assert selected[0]["reason"] == "gedung sama, okupansi 20.0%"


@pytest.mark.parametrize(
    ("origin_building", "room_building"),
    [
        (None, "Gedung A"),
        ("Gedung A", None),
        ("  ", "Gedung A"),
        ("Gedung A", " \t"),
    ],
)
def test_recommendations_mark_null_or_blank_buildings_unknown(
    origin_building, room_building
):
    origin = {"room_id": "origin", "building": origin_building}
    room = {
        "room_id": "candidate",
        "room_name": "Room",
        "building": room_building,
        "status": LOW,
        "capacity": 100,
        "occupancy_pct_raw": 12.36,
        "available_seats": 80,
    }

    selected = select_recommendations(origin, [room])

    assert selected[0]["reason"] == "gedung tidak diketahui, okupansi 12.3%"
    assert selected[0]["occupancy_pct"] == 12.3


def test_recommendations_round_display_percentage_but_keep_raw_sort_order():
    origin = {"room_id": "origin", "building": "A"}
    rooms = [
        {
            "room_id": "round-up",
            "room_name": "Room",
            "building": "A",
            "status": LOW,
            "capacity": 1000,
            "occupancy_pct_raw": 12.36,
            "available_seats": 80,
        },
        {
            "room_id": "round-down",
            "room_name": "Room",
            "building": "A",
            "status": LOW,
            "capacity": 1000,
            "occupancy_pct_raw": 12.34,
            "available_seats": 80,
        },
    ]

    selected = select_recommendations(origin, rooms)

    assert [room["room_id"] for room in selected] == ["round-down", "round-up"]
    assert [room["occupancy_pct"] for room in selected] == [12.3, 12.3]
    assert [room["reason"] for room in selected] == [
        "gedung sama, okupansi 12.3%",
        "gedung sama, okupansi 12.3%",
    ]


def test_recommendations_exclude_full_stale_unconfigured_and_optional_simulated():
    origin = {"room_id": "origin", "building": None}
    rooms = [
        {
            "room_id": "full",
            "status": FULL,
            "capacity": 100,
            "occupancy_pct_raw": 90,
            "available_seats": 10,
        },
        {
            "room_id": "stale",
            "status": LOW,
            "capacity": 100,
            "occupancy_pct_raw": 10,
            "available_seats": 90,
            "is_stale": True,
        },
        {
            "room_id": "no-capacity",
            "status": LOW,
            "capacity": None,
            "occupancy_pct_raw": None,
            "available_seats": None,
        },
        {
            "room_id": "simulated",
            "status": EMPTY,
            "capacity": 100,
            "occupancy_pct_raw": 0,
            "available_seats": 100,
            "is_simulated": True,
        },
    ]

    assert select_recommendations(origin, rooms, include_simulated=False) == []
    assert select_recommendations(origin, rooms)[0]["room_id"] == "simulated"


def test_recommendations_tie_break_by_seats_and_apply_default_limit():
    origin = {"room_id": "origin", "building": "A"}
    rooms = [
        {
            "room_id": f"room-{index}",
            "room_name": f"Room {index}",
            "building": "A",
            "status": LOW,
            "capacity": 100,
            "occupancy_pct_raw": 20,
            "available_seats": seats,
        }
        for index, seats in enumerate((60, 80, 70, 90))
    ]

    selected = select_recommendations(origin, rooms)

    assert [room["room_id"] for room in selected] == [
        "room-3",
        "room-1",
        "room-2",
    ]
    assert select_recommendations(origin, []) == []
