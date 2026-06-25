# ============================================================================
# FINAL MQTT TOPICS FOR FIRMWARE SYNCHRONIZATION REFERENCE
# ----------------------------------------------------------------------------
# Command (Backend -> ESP32):
# - Light : devices/{room_id}/light/{relay_channel}
# - AC    : devices/{room_id}/ac
# - Status: devices/{room_id}/status/request
#
# Event/Response (ESP32 -> Backend):
# - Online: devices/{room_id}/status/online
# - Status: devices/{room_id}/status/response
#
# NOTE: The firmware (ESP32) MUST subscribe to and publish on these exact
# prefixes (`devices/`). Ensure {room_id} and {relay_channel} types match!
# ============================================================================

import paho.mqtt.client as mqtt
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class MQTTSubscriber:
    def __init__(self):
        self.broker = os.getenv("MQTT_BROKER", "localhost")
        self.port = int(os.getenv("MQTT_PORT", 1883))
        self.username = os.getenv("MQTT_USER")
        self.password = os.getenv("MQTT_PASSWORD")
        
        self.topic_trigger = os.getenv("MQTT_TOPIC_TRIGGER", "camera/trigger")
        self.topic_request = os.getenv("MQTT_TOPIC_REQUEST", "ai/inference/request")
        self.topic_zone_reload = "ai/zone/reload"
        self.topic_esp32_online = "devices/+/status/online"
        
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info(f"✅ Connected to MQTT Broker: {self.broker}:{self.port}")
            # Subscribe ke topic setelah connect
            client.subscribe(self.topic_trigger)
            client.subscribe(self.topic_request)
            client.subscribe(self.topic_zone_reload)
            client.subscribe("devices/+/status/response")
            client.subscribe(self.topic_esp32_online)
        else:
            logger.error(f"❌ Failed to connect, reason: {reason_code}")

    def _on_message(self, client, userdata, message):
        topic = message.topic
        try:
            payload = json.loads(message.payload.decode("utf-8"))
        except json.JSONDecodeError:
            payload = message.payload.decode("utf-8")

        logger.info(f"📨 Message received | Topic: {topic} | Payload: {payload}")
        self._route_message(topic, payload)

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        logger.warning(f"⚠️ Disconnected from MQTT, reason: {reason_code}")

    def _route_message(self, topic: str, payload):
        """Routing pesan berdasarkan topic"""
        if topic == self.topic_trigger:
            self._handle_camera_trigger(payload)
        elif topic == self.topic_request:
            self._handle_inference_request(payload)
        elif topic == self.topic_zone_reload:
            self._handle_zone_reload()
        elif topic.startswith("devices/") and topic.endswith("/status/response"):
            self._handle_status_response(payload)
        elif topic.startswith("devices/") and topic.endswith("/status/online"):
            self._handle_esp32_online(topic, payload)
        elif topic.startswith("devices/") and ("light" in topic or "ac" in topic):
            self._handle_device_command(topic, payload)

    def _handle_device_command(self, topic: str, payload):
        """Handle incoming command messages to track manual overrides"""
        if not isinstance(payload, dict):
            return
        
        source = payload.get("source")
        if source == "manual":
            parts = topic.split('/')
            if len(parts) >= 2:
                try:
                    room_id = int(parts[1])
                    try:
                        from app.schedule_runner import last_manual_command_time
                    except ImportError:
                        from schedule_runner import last_manual_command_time
                    
                    import time
                    last_manual_command_time[room_id] = time.time()
                    logger.info(f"🚨 Recorded manual override command for Room {room_id}!")
                except ValueError:
                    pass

    def _handle_camera_trigger(self, payload):
        """Handle trigger untuk ambil snapshot"""
        from app.snapshot import take_snapshot
        logger.info("📷 Camera trigger received, taking snapshot...")
        take_snapshot()

    def _handle_inference_request(self, payload):
        """Handle request inference dari MQTT"""
        from app.inference_realtime import run_inference
        image_path = payload.get("image_path") if isinstance(payload, dict) else None
        logger.info(f"🤖 Inference request received: {image_path}")
        run_inference(image_path)

    def _handle_zone_reload(self):
        """Force zone reload via MQTT"""
        try:
            from app.inference_realtime import force_zone_reload
            force_zone_reload()
        except ImportError:
            pass

    def _handle_status_response(self, payload):
        """Handle status response dari ESP32"""
        try:
            from app.mqtt_commands import mqtt_commander
        except ImportError:
            from mqtt_commands import mqtt_commander
        logger.info("📡 ESP32 status response received, processing...")
        mqtt_commander.handle_status_response(payload)

    def _handle_esp32_online(self, topic: str, payload):
        """Handle ESP32 reconnect online status message"""
        parts = topic.split('/')
        if len(parts) >= 2:
            try:
                room_id = parts[1]
                logger.info(f"📡 ESP32 in Room {room_id} is online! Triggering state restoration...")
                
                try:
                    from app.boot_recovery import BootRecoveryManager
                except ImportError:
                    from boot_recovery import BootRecoveryManager
                
                try:
                    from app.mqtt_commands import mqtt_commander
                except ImportError:
                    from mqtt_commands import mqtt_commander
                
                recovery = BootRecoveryManager(mqtt_commander)
                recovery.restore_for_room(room_id)
                logger.info(f"✅ Successfully restored state for Room {room_id} on ESP32 reconnect.")
            except Exception as e:
                logger.error(f"❌ Error restoring state for Room {room_id}: {e}")

    def publish(self, topic: str, payload: dict):
        """Publish hasil ke topic tertentu"""
        self.client.publish(topic, json.dumps(payload))
        logger.info(f"📤 Published to {topic}: {payload}")

    def start(self):
        """Connect dan mulai loop"""
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()  # Non-blocking
            logger.info("🚀 MQTT Subscriber started")
        except Exception as e:
            logger.error(f"❌ MQTT connection error: {e}")
            raise

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("🛑 MQTT Subscriber stopped")


# Singleton instance
mqtt_client = MQTTSubscriber()
