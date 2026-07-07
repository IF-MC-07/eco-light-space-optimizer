import time
from unittest.mock import patch, MagicMock
import pandas as pd
from app.decision_engine import DecisionEngine
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "datasets"

power_file = DATA_DIR / "household_power_consumption.txt"
occ_file = DATA_DIR / "Occupancy_Estimation.csv"
# 1. Load dataset occupancy publik (UCI Occupancy Detection), resample ke interval simulasi
occ_df = pd.read_csv(occ_file, parse_dates={"datetime": ["Date", "Time"]}, na_values="?")
occ_df = occ_df.dropna(subset=["datetime"])

# 2. Mock MQTT commander supaya tidak publish ke broker asli / relay fisik
mock_commander = MagicMock()
with patch("app.decision_engine.mqtt_commander", mock_commander):
    engine = DecisionEngine()

    # 3. Mock time.time() supaya delay logic terpicu sesuai waktu SIMULASI, bukan wall clock
    sim_clock = {"t": occ_df["datetime"].iloc[0].timestamp()}

    def fake_time():
        return sim_clock["t"]

    with patch("app.decision_engine.time.time", side_effect=fake_time):
        for _, row in occ_df.iterrows():
            sim_clock["t"] = row["datetime"].timestamp()
            zone_name = "Zona-1"  # sesuaikan nama zone di tabel zones untuk room demo
            occupancy_counts = {zone_name: 1 if row["Room_Occupancy_Count"] > 0 else 0}

            engine.process_inference(camera_id="", occupancy_counts=occupancy_counts)

    print("Light command calls:", mock_commander.send_light_command.call_count)
    print("AC command calls:", mock_commander.send_ac_command.call_count)
    for call in mock_commander.send_light_command.call_args_list:
        print(call)