"""Unit tests for DslbConfig dataclass and validation."""

import os
import pytest
from app.dslb_config import DslbConfig


def test_dslb_config_defaults():
    cfg = DslbConfig()
    cfg.validate()
    assert cfg.enabled is True
    assert cfg.status_sedang_min_pct == 40.0
    assert cfg.status_padat_min_pct == 75.0
    assert cfg.confirm_cycles == 2
    assert cfg.smoothing_window == 3
    assert cfg.cycle_seconds == 15
    assert cfg.stale_seconds == 60
    assert cfg.reco_log_min_interval_seconds == 300
    assert cfg.max_recommendations == 3
    assert cfg.history_heartbeat_seconds == 300
    assert cfg.include_simulated is True


def test_dslb_config_from_env(monkeypatch):
    monkeypatch.setenv("DSLB_ENABLED", "false")
    monkeypatch.setenv("DSLB_STATUS_SEDANG_MIN_PCT", "35.5")
    monkeypatch.setenv("DSLB_STATUS_PADAT_MIN_PCT", "80.0")
    monkeypatch.setenv("DSLB_CONFIRM_CYCLES", "4")
    monkeypatch.setenv("DSLB_SMOOTHING_WINDOW", "5")
    monkeypatch.setenv("DSLB_CYCLE_SECONDS", "10")
    monkeypatch.setenv("DSLB_STALE_SECONDS", "45")
    monkeypatch.setenv("DSLB_RECO_LOG_MIN_INTERVAL_SECONDS", "120")
    monkeypatch.setenv("DSLB_MAX_RECOMMENDATIONS", "5")
    monkeypatch.setenv("DSLB_HISTORY_HEARTBEAT_SECONDS", "600")
    monkeypatch.setenv("DSLB_INCLUDE_SIMULATED", "0")

    cfg = DslbConfig.from_env()
    assert cfg.enabled is False
    assert cfg.status_sedang_min_pct == 35.5
    assert cfg.status_padat_min_pct == 80.0
    assert cfg.confirm_cycles == 4
    assert cfg.smoothing_window == 5
    assert cfg.cycle_seconds == 10
    assert cfg.stale_seconds == 45
    assert cfg.reco_log_min_interval_seconds == 120
    assert cfg.max_recommendations == 5
    assert cfg.history_heartbeat_seconds == 600
    assert cfg.include_simulated is False


@pytest.mark.parametrize(
    "sedang,padat",
    [
        (50.0, 40.0),  # sedang > padat
        (50.0, 50.0),  # sedang == padat
        (-5.0, 50.0),  # sedang < 0
    ],
)
def test_dslb_config_invalid_thresholds(sedang, padat):
    cfg = DslbConfig(status_sedang_min_pct=sedang, status_padat_min_pct=padat)
    with pytest.raises(ValueError, match="Invalid threshold"):
        cfg.validate()


@pytest.mark.parametrize(
    "kwargs,err_match",
    [
        ({"confirm_cycles": 0}, "confirm_cycles must be a positive integer"),
        ({"smoothing_window": -1}, "smoothing_window must be a positive integer"),
        ({"cycle_seconds": 0}, "cycle_seconds must be a positive integer"),
        ({"stale_seconds": -10}, "stale_seconds must be a positive integer"),
        ({"reco_log_min_interval_seconds": 0}, "reco_log_min_interval_seconds must be a positive integer"),
        ({"max_recommendations": 0}, "max_recommendations must be a positive integer"),
        ({"history_heartbeat_seconds": -5}, "history_heartbeat_seconds must be a positive integer"),
    ],
)
def test_dslb_config_invalid_integers(kwargs, err_match):
    cfg = DslbConfig(**kwargs)
    with pytest.raises(ValueError, match=err_match):
        cfg.validate()

