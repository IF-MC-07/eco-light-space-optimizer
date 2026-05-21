# MULTI-ROOM DEPLOYMENT:
# Run one instance per camera/room with different .env files:
#   ID_KAMERA=CAM-701 python main.py
#   ID_KAMERA=CAM-801 python main.py
# Or use separate .env files:
#   ENV_FILE=.env.room701 python main.py

import os
import sys
import threading
import logging
import uvicorn
from dotenv import load_dotenv

try:
    from app.inference_realtime import run as run_inference
except ImportError:
    from inference_realtime import run as run_inference

try:
    from app.schedule_runner import ScheduleRunner
except ImportError:
    from schedule_runner import ScheduleRunner

try:
    from app.mqtt_subscriber import mqtt_client
except ImportError:
    from mqtt_subscriber import mqtt_client

try:
    from app.db_healthcheck import wait_for_db, wait_for_mqtt
except ImportError:
    from db_healthcheck import wait_for_db, wait_for_mqtt

try:
    from app.boot_recovery import BootRecoveryManager
except ImportError:
    from boot_recovery import BootRecoveryManager

try:
    from app.mqtt_commands import MQTTCommander
except ImportError:
    from mqtt_commands import MQTTCommander

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

# DB healthcheck config
DB_MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", 20))
DB_RETRY_INTERVAL = int(os.getenv("DB_RETRY_INTERVAL", 3))
MQTT_MAX_RETRIES = int(os.getenv("MQTT_MAX_RETRIES", 20))
MQTT_RETRY_INTERVAL = int(os.getenv("MQTT_RETRY_INTERVAL", 3))

def main():
    logger.info("🚀 Eco-Light AI Service starting...")

    # STEP 1: Wait for PostgreSQL
    wait_for_db(max_retries=DB_MAX_RETRIES, interval=DB_RETRY_INTERVAL)

    # STEP 2: Wait for MQTT broker
    wait_for_mqtt(
        host=os.getenv("MQTT_BROKER", "localhost"),
        port=int(os.getenv("MQTT_PORT", 1883)),
        max_retries=MQTT_MAX_RETRIES,
        interval=MQTT_RETRY_INTERVAL
    )

    # STEP 3: Start MQTT subscriber
    logger.info("📡 Starting MQTT subscriber...")
    mqtt_client.start()

    # STEP 4: Init MQTT commander
    commander = MQTTCommander()

    # STEP 5: Run boot recovery (blocking, waits BOOT_RECOVERY_DELAY seconds)
    logger.info("🔄 Running boot recovery...")
    recovery = BootRecoveryManager(commander)
    recovery.run()
    logger.info("✅ Boot recovery complete.")

    # STEP 6: Start schedule runner in background
    logger.info("⏰ Starting Schedule Runner background thread...")
    schedule_runner = ScheduleRunner()
    threading.Thread(target=schedule_runner.run, daemon=True).start()

    # STEP 7: Start FastAPI in background
    logger.info("⚡ Starting FastAPI Server on http://localhost:8000...")
    threading.Thread(
        target=lambda: uvicorn.run("app.snapshot:app", host="0.0.0.0", port=8000, log_level="info"),
        daemon=True
    ).start()

    # STEP 8: Start inference (blocking main thread)
    logger.info("▶️  Starting YOLOv8 inference loop...")
    run_inference()

if __name__ == "__main__":
    main()