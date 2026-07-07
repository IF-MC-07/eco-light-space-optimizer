"""
app/models/energy.py — SQLAlchemy ORM model for power_sensors table.

IMPORTANT: The primary energy ingestion path does NOT use SQLAlchemy.
It uses psycopg2 directly via zona_loader.get_db_connection() inside
mqtt_subscriber._handle_energy().

This model is provided for:
  - FastAPI endpoints that may need ORM-style queries
  - Admin tooling / debugging
  - Ensuring `from app.models.energy import PowerSensorReading` does not crash

The actual table in Supabase is: power_sensors
Columns: sensor_id, room_id, voltage_v, current_a, power_watts, read_at
"""

from sqlalchemy import Column, Float, String, DateTime
from sqlalchemy.sql import func

try:
    from app.db import Base
except ImportError:
    from db import Base


class PowerSensorReading(Base):
    """
    Mirrors the `power_sensors` table.
    One row per PZEM reading — real-time raw data.
    """
    __tablename__ = "power_sensors"

    sensor_id  = Column(String(30), primary_key=True)
    room_id    = Column(String(30), index=True, nullable=False)
    voltage_v  = Column(Float, nullable=True)
    current_a  = Column(Float, nullable=True)
    power_watts = Column(Float, nullable=True)
    read_at    = Column(DateTime(timezone=True), server_default=func.now())


class EnergyLogRecord(Base):
    """
    Mirrors the `energy_logs` table.
    One row per room per day — daily aggregate.
    """
    __tablename__ = "energy_logs"

    log_id       = Column(String(30), primary_key=True)
    room_id      = Column(String(30), index=True, nullable=False)
    date         = Column(DateTime(timezone=False), nullable=True)
    voltage      = Column(Float, default=0.0)
    current      = Column(Float, default=0.0)
    power        = Column(Float, default=0.0)
    energy       = Column(Float, nullable=True)   # kWh — optional
    frequency    = Column(Float, nullable=True)   # Hz  — optional
    power_factor = Column(Float, nullable=True)   # 0-1 — optional
    total_watts  = Column(Float, default=0.0)
    saved_watts  = Column(Float, default=0.0)


# ---------------------------------------------------------------------------
# Backward-compatibility alias
# Some old imports may reference `EnergyReading` — point them to the correct model
# ---------------------------------------------------------------------------
EnergyReading = PowerSensorReading