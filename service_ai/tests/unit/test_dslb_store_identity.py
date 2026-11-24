"""Verification that inference_realtime and dslb_engine share a single occupancy_store."""

import sys
import pytest


def test_single_occupancy_store_identity():
    # 1. Import like main.py does
    try:
        from app.inference_realtime import record_count
    except ImportError:
        from inference_realtime import record_count

    try:
        from app.dslb_engine import DslbEngine, global_store
    except ImportError:
        from dslb_engine import DslbEngine, global_store

    # 2. Verify sys.modules has only ONE occupancy_store module loaded
    store_modules = [name for name in sys.modules if name in ("app.occupancy_store", "occupancy_store")]
    assert len(store_modules) == 1, (
        f"Expected exactly 1 occupancy_store module in sys.modules, found {len(store_modules)}: {store_modules}"
    )

    # 3. Verify record_count writes are read by the engine's store
    test_cam = "CAM-IDENTITY-CHECK"
    record_count(test_cam, 42)

    result = global_store.get_count(test_cam)
    assert result is not None, "Reading recorded by record_count not found in engine global_store"
    count, age = result
    assert count == 42
    assert age >= 0.0
    assert age < 1.0


def test_zero_count_propagates_to_engine_store():
    try:
        from app.inference_realtime import record_count
    except ImportError:
        from inference_realtime import record_count

    try:
        from app.dslb_engine import global_store
    except ImportError:
        from dslb_engine import global_store

    zero_cam = "CAM-ZERO-IDENTITY"
    record_count(zero_cam, 0)

    result = global_store.get_count(zero_cam)
    assert result is not None
    assert result[0] == 0

