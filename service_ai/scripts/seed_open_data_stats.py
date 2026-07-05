import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.zona_loader import get_db_connection, release_connection
from app.statistics_engine import get_realtime_stats, get_energy_summary, detect_usage_alerts
from pathlib import Path
import uuid

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "datasets"

power_file = DATA_DIR / "household_power_consumption.txt"
occ_file = DATA_DIR / "Occupancy_Estimation.csv"

print("Loading CSV...")
df = pd.read_csv(power_file, sep=";", na_values="?")
print(f"Loaded {len(df)} rows, parsing dates...")
df["datetime"] = pd.to_datetime(
    df["Date"] + " " + df["Time"],
    format="%d/%m/%Y %H:%M:%S"
)
df = df.drop(columns=["Date", "Time"])

# 2. Rescale kW rumah tangga -> watt ruangan kelas (asumsi eksplisit, catat di laporan)
df["power_watts"] = (df["Global_active_power"] * 1000) * 0.15  # skala turun, sesuaikan ke kapasitas relay 1 channel

# 3. Ambil subset waktu (misal 3 hari) biar tidak overload testing
sample = df.set_index("datetime").loc["2007-01-01":"2007-01-03"].reset_index()

room_id = "ROM-bc077ce0"

conn = get_db_connection()
with conn.cursor() as cur:
    from psycopg2.extras import execute_values
    rows = [(f"PWR-{room_id}-{i:06d}", room_id, r["power_watts"], 220.0, r["power_watts"]/220.0, r["datetime"])
        for i, (_, r) in enumerate(sample.iterrows())]
    execute_values(cur, """
        INSERT INTO power_sensors (sensor_id, room_id, power_watts, voltage_v, current_a, read_at)
        VALUES %s
""", rows)
conn.commit()
release_connection(conn)

print(f"Loaded {len(df)} rows, parsing dates...")
print(f"Inserted {len(sample)} rows into power_sensors")
