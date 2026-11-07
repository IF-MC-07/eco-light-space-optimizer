"""Configuration dataclass and environment loader for DSLB."""

import os
from dataclasses import dataclass
from typing import Optional


def _parse_bool(val: Optional[str], default: bool) -> bool:
    if val is None:
        return default
    v = val.strip().lower()
    if v in ("true", "1", "yes", "y", "on"):
        return True
    if v in ("false", "0", "no", "n", "off"):
        return False
    return default


def _parse_int(val: Optional[str], default: int) -> int:
    if val is None:
        return default
    return int(val.strip())


def _parse_float(val: Optional[str], default: float) -> float:
    if val is None:
        return default
    return float(val.strip())


@dataclass(frozen=True)
class DslbConfig:
    enabled: bool = True
    status_sedang_min_pct: float = 40.0
    status_padat_min_pct: float = 75.0
    confirm_cycles: int = 2
    smoothing_window: int = 3
    cycle_seconds: int = 15
    stale_seconds: int = 60
    reco_log_min_interval_seconds: int = 300
    max_recommendations: int = 3
    history_heartbeat_seconds: int = 300
    include_simulated: bool = True

    def validate(self) -> None:
        """Validate configuration rules. Raises ValueError if invalid."""
        if not (0.0 <= self.status_sedang_min_pct < self.status_padat_min_pct):
            raise ValueError(
                f"Invalid threshold: must satisfy 0 <= sedang ({self.status_sedang_min_pct}) "
                f"< padat ({self.status_padat_min_pct})"
            )
        if self.confirm_cycles <= 0:
            raise ValueError(f"confirm_cycles must be a positive integer, got {self.confirm_cycles}")
        if self.smoothing_window <= 0:
            raise ValueError(f"smoothing_window must be a positive integer, got {self.smoothing_window}")
        if self.cycle_seconds <= 0:
            raise ValueError(f"cycle_seconds must be a positive integer, got {self.cycle_seconds}")
        if self.stale_seconds <= 0:
            raise ValueError(f"stale_seconds must be a positive integer, got {self.stale_seconds}")
        if self.reco_log_min_interval_seconds <= 0:
            raise ValueError(
                f"reco_log_min_interval_seconds must be a positive integer, got {self.reco_log_min_interval_seconds}"
            )
        if self.max_recommendations <= 0:
            raise ValueError(f"max_recommendations must be a positive integer, got {self.max_recommendations}")
        if self.history_heartbeat_seconds <= 0:
            raise ValueError(
                f"history_heartbeat_seconds must be a positive integer, got {self.history_heartbeat_seconds}"
            )

    @classmethod
    def from_env(cls) -> "DslbConfig":
        """Load DSLB configuration from environment variables with defaults."""
        config = cls(
            enabled=_parse_bool(os.getenv("DSLB_ENABLED"), True),
            status_sedang_min_pct=_parse_float(os.getenv("DSLB_STATUS_SEDANG_MIN_PCT"), 40.0),
            status_padat_min_pct=_parse_float(os.getenv("DSLB_STATUS_PADAT_MIN_PCT"), 75.0),
            confirm_cycles=_parse_int(os.getenv("DSLB_CONFIRM_CYCLES"), 2),
            smoothing_window=_parse_int(os.getenv("DSLB_SMOOTHING_WINDOW"), 3),
            cycle_seconds=_parse_int(os.getenv("DSLB_CYCLE_SECONDS"), 15),
            stale_seconds=_parse_int(os.getenv("DSLB_STALE_SECONDS"), 60),
            reco_log_min_interval_seconds=_parse_int(os.getenv("DSLB_RECO_LOG_MIN_INTERVAL_SECONDS"), 300),
            max_recommendations=_parse_int(os.getenv("DSLB_MAX_RECOMMENDATIONS"), 3),
            history_heartbeat_seconds=_parse_int(os.getenv("DSLB_HISTORY_HEARTBEAT_SECONDS"), 300),
            include_simulated=_parse_bool(os.getenv("DSLB_INCLUDE_SIMULATED"), True),
        )
        config.validate()
        return config

