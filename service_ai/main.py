import logging
import time
from app.mqtt_subscriber import mqtt_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

if __name__ == "__main__":
    mqtt_client.start()
    
    try:
        print("🟢 Service AI running... Press Ctrl+C to stop")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        mqtt_client.stop()