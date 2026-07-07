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
# - Energy: devices/{room_id}/energy
#
# Energy payload (current firmware — only voltage/current/power are mandatory):
# {
#   "room_id": "ROM-1464452b",
#   "voltage": 220.0,
#   "current": 0.45,
#   "power": 98.0,
#   "energy": 0.05,     <- OPTIONAL, firmware may not send this yet
#   "frequency": 50.0,  <- OPTIONAL, firmware may not send this yet
#   "pf": 0.95          <- OPTIONAL, firmware may not send this yet
# }
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
            client.subscribe(self.topic_trigger)
            client.subscribe(self.topic_request)
            client.subscribe(self.topic_zone_reload)
            client.subscribe("devices/+/status/response")
            client.subscribe(self.topic_esp32_online)
            client.subscribe("devices/+/energy")
            logger.info("📡 Subscribed to all topics including devices/+/energy")
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
        """Route incoming MQTT messages to the correct handler."""
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
        elif topic.startswith("devices/") and topic.endswith("/energy"):
            self._handle_energy(topic, payload)
        else:
            logger.debug(f"Unhandled topic: {topic}")

    # =========================================================================
    # PRIMARY ENERGY HANDLER — writes to power_sensors AND energy_logs
    # =========================================================================
    def _handle_energy(self, topic: str, payload: dict):
        """
        Handle PZEM-004T energy data from ESP32.
        Topic  : devices/{room_id}/energy
        Payload: {
            "room_id":   "ROM-1464452b",   <- required
            "voltage":   220.0,            <- required
            "current":   0.45,             <- required
            "power":     98.0,             <- required
            "energy":    0.05,             <- OPTIONAL (firmware may not send yet)
            "frequency": 50.0,             <- OPTIONAL (firmware may not send yet)
            "pf":        0.95              <- OPTIONAL (firmware may not send yet)
        }

        Inserts into:
          1. power_sensors — one row per reading (real-time raw data)
          2. energy_logs   — daily upsert (accumulated daily energy log)
        """
        import datetime

        try:
            from app.zona_loader import get_db_connection, release_connection
        except ImportError:
            from zona_loader import get_db_connection, release_connection

        conn = None
        try:
            # --- Extract and validate room_id ---
            # Try from payload first; fall back to extracting from topic
            # Topic format: devices/{room_id}/energy
            room_id = payload.get("room_id")
            if not room_id:
                parts = topic.split("/")
                if len(parts) >= 3:
                    room_id = parts[1]
            if not room_id:
                logger.error("❌ [ENERGY] Cannot determine room_id — message dropped")
                return

            # --- Extract fields; optional fields default to None (stored as NULL) ---
            voltage   = float(payload.get("voltage", 0.0))
            current   = float(payload.get("current", 0.0))
            power     = float(payload.get("power", 0.0))

            # Optional fields — use None if not present so DB stores NULL
            energy_raw    = payload.get("energy")
            frequency_raw = payload.get("frequency")
            pf_raw        = payload.get("pf")

            energy    = float(energy_raw)    if energy_raw    is not None else None
            frequency = float(frequency_raw) if frequency_raw is not None else None
            pf        = float(pf_raw)        if pf_raw        is not None else None

            conn = get_db_connection()
            with conn.cursor() as cur:
                # -----------------------------------------------------------------
                # 1. INSERT into power_sensors (real-time raw reading)
                # Columns: sensor_id, room_id, voltage_v, current_a, power_watts, read_at
                # sensor_id is auto-generated using the same pattern as the Sequelize model
                # -----------------------------------------------------------------
                import uuid
                sensor_id = "PWR" + uuid.uuid4().hex[:15].upper()

                cur.execute("""
                    INSERT INTO power_sensors
                        (sensor_id, room_id, voltage_v, current_a, power_watts, read_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (sensor_id, room_id, voltage, current, power))

                # -----------------------------------------------------------------
                # 2. UPSERT into energy_logs (daily aggregate)
                # Columns: log_id, room_id, voltage, current, power, energy,
                #          frequency, power_factor, total_watts, saved_watts, date
                #
                # Strategy:
                #   - On INSERT: start a new daily row for today.
                #   - On CONFLICT (room_id, date): update with latest sensor
                #     values and accumulate total_watts (running sum of power
                #     readings for the day — approximates daily watt-hours).
                #
                # NOTE: ON CONFLICT requires a UNIQUE constraint on (room_id, date).
                # If it does not exist yet, run:
                #   ALTER TABLE energy_logs
                #   ADD CONSTRAINT energy_logs_room_date_unique
                #   UNIQUE (room_id, date);
                # -----------------------------------------------------------------
                today = datetime.date.today()
                log_id = "ENG" + uuid.uuid4().hex[:15].upper()

                cur.execute("""
                    INSERT INTO energy_logs
                        (log_id, room_id, date,
                         voltage, current, power,
                         energy, frequency, power_factor,
                         total_watts, saved_watts)
                    VALUES (%s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s,
                            %s, 0)
                    ON CONFLICT (room_id, date)
                    DO UPDATE SET
                        voltage      = EXCLUDED.voltage,
                        current      = EXCLUDED.current,
                        power        = EXCLUDED.power,
                        energy       = COALESCE(EXCLUDED.energy,      energy_logs.energy),
                        frequency    = COALESCE(EXCLUDED.frequency,    energy_logs.frequency),
                        power_factor = COALESCE(EXCLUDED.power_factor, energy_logs.power_factor),
                        total_watts  = energy_logs.total_watts + EXCLUDED.power
                """, (
                    log_id, room_id, today,
                    voltage, current, power,
                    energy, frequency, pf,
                    power
                ))

            conn.commit()

            logger.info(
                f"💾 [ENERGY] Saved → Room {room_id} | "
                f"V={voltage}V I={current}A P={power}W "
                f"E={energy}kWh freq={frequency}Hz PF={pf}"
            )

        except Exception as e:
            logger.error(f"❌ [ENERGY] Failed to save energy data: {e}", exc_info=True)
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
        finally:
            if conn:
                try:
                    from app.zona_loader import release_connection
                except ImportError:
                    from zona_loader import release_connection
                release_connection(conn)

    # =========================================================================
    # CAMERA / INFERENCE HANDLERS
    # =========================================================================
    def _handle_camera_trigger(self, payload):
        from app.snapshot import take_snapshot
        logger.info("📷 Camera trigger received, taking snapshot...")
        take_snapshot()

    def _handle_inference_request(self, payload):
        from app.inference_realtime import run_inference
        image_path = payload.get("image_path") if isinstance(payload, dict) else None
        logger.info(f"🤖 Inference request received: {image_path}")
        run_inference(image_path)

    def _handle_zone_reload(self):
        try:
            from app.inference_realtime import force_zone_reload
            force_zone_reload()
        except ImportError:
            pass

    def _handle_status_response(self, payload):
        try:
            from app.mqtt_commands import mqtt_commander
        except ImportError:
            from mqtt_commands import mqtt_commander
        logger.info("📡 ESP32 status response received, processing...")
        mqtt_commander.handle_status_response(payload)

    def _handle_esp32_online(self, topic: str, payload):
        parts = topic.split('/')
        if len(parts) >= 2:
            try:
                room_id = parts[1]
                logger.info(f"📡 ESP32 in Room {room_id} is online! Triggering state restoration...")
                from app.boot_recovery import BootRecoveryManager
                from app.mqtt_commands import mqtt_commander
                recovery = BootRecoveryManager(mqtt_commander)
                recovery.restore_for_room(room_id)
            except Exception as e:
                logger.error(f"❌ Error restoring state: {e}")

    def publish(self, topic: str, payload: dict):
        self.client.publish(topic, json.dumps(payload))
        logger.info(f"📤 Published to {topic}: {payload}")

    def start(self):
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
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
if __name__ == "__main__":
    import time
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s"
    )

    mqtt_client.start()

    print("===================================")
    print(" MQTT Subscriber Running...")
    print(" Waiting for ESP32 messages...")
    print("===================================")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        mqtt_client.stop()
        print("Subscriber stopped.")