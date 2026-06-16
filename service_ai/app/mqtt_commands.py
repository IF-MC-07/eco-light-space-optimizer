import json
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

### Import dependencies
try:
    from app.mqtt_subscriber import mqtt_client
except ImportError:
    from mqtt_subscriber import mqtt_client

load_dotenv()
logger = logging.getLogger(__name__)

class MQTTCommander:
    def send_light_command(self, room_id: int, relay_channel: int, command: str, zone_id: int, zone_name: str, source: str = "ai_decision"):
        """
        Mengirim perintah ke ESP32. Topik disesuaikan dengan firmware IoT.
        """
        topic = os.getenv("MQTT_TOPIC_CONTROL", "polibatam/eco/control")
        relay_value = 1 if command.upper() == "ON" else 0
        
        payload = {
            f"relay{relay_channel}": relay_value,
            "room_id": room_id,
            "zone_name": zone_name,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }

        try:
            mqtt_client.publish(topic, json.dumps(payload))
            logger.info(f"💡 Light command published to {topic}: {payload}")
        except Exception as e:
            logger.error(f"❌ Failed to publish light command: {e}")

# Pastikan baris ini di margin paling kiri (tidak menjorok)
mqtt_commander = MQTTCommander()