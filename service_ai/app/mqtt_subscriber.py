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
#
# ============================================================================
# PATCH NOTES (fixed version)
# ----------------------------------------------------------------------------
# 1. Added subscription to "devices/+/energy" in _on_connect (previously
#    missing -> _handle_energy() was unreachable dead code).
# 2. Added routing branch in _route_message() for the energy topic.
# 3. _handle_energy() now performs a REAL upsert (ON CONFLICT DO UPDATE)
#    instead of a plain INSERT that silently failed/rolled back on the
#    second message of the same day for the same room.
# 4. total_watts is no longer a raw instantaneous Watt snapshot. It is now
#    an accumulated kWh value computed via trapezoidal-rule integration of
#    power over the time elapsed since the previous reading for that room:
#        E_increment(kWh) = ((P_now + P_prev) / 2) * delta_t(hours) / 1000
#    This follows the standard electrical energy relation E = ∫P dt.
# 5. Delta-t is computed from the DB (last row in power_sensors for that
#    room), NOT from in-memory state -> correct even after service restart
#    or when running multiple instances.
# 6. Delta-t is capped at 1 hour to avoid inflating totals after a long
#    device offline gap (defensive guard against clock/connectivity gaps).
#
# REQUIRES a UNIQUE constraint on energy_logs(room_id, date). See the
# accompanying migration_energy_logs_constraint.sql file.
#
# IMPORTANT: verify whether a separate Node.js MQTT client (e.g.
# mqttService.js) ALSO subscribes to "devices/+/energy" and writes to
# power_sensors / energy_logs. If it does, this fix alone is NOT sufficient
# — you will have two independent, uncoordinated writers racing on the same
# rows (a classic "lost update" problem). Pick exactly one authoritative
# ingestion path and disable energy handling in the other.
# ============================================================================

import paho.mqtt.client as mqtt
import os
import json
import logging
import datetime
import uuid
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Maximum allowed gap (in hours) between two consecutive readings for the
# same room when computing incremental energy. Gaps larger than this are
# treated as "device was offline" and contribute 0 kWh for that interval,
# to avoid artificially inflating the daily total.
MAX_INTEGRATION_GAP_HOURS = 1.0


class MQTTSubscriber:
    def __init__(self):
        self.started = False
        self._restored_rooms = set()
        self.broker = os.getenv("MQTT_BROKER", "localhost")
        self.port = int(os.getenv("MQTT_PORT", 1883))
        self.username = os.getenv("MQTT_USER")
        self.password = os.getenv("MQTT_PASSWORD")

        self.topic_trigger = os.getenv("MQTT_TOPIC_TRIGGER", "camera/trigger")
        self.topic_request = os.getenv("MQTT_TOPIC_REQUEST", "ai/inference/request")
        self.topic_zone_reload = "ai/zone/reload"
        self.topic_esp32_online = "devices/+/status/online"
        self.topic_energy = "devices/+/energy"  # [FIX] was previously not defined/subscribed

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
            client.subscribe(self.topic_energy)  # [FIX] energy topic now actually subscribed
            logger.info("📡 Subscribed to control/status/energy topics")
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
            # [FIX] this branch previously did not exist -> dead code
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
          1. power_sensors — one row per reading (real-time raw data, unchanged)
          2. energy_logs   — daily UPSERT that ACCUMULATES true kWh via
                             trapezoidal integration of power over elapsed time
        """
        try:
            from app.zona_loader import get_db_connection, release_connection
        except ImportError:
            from zona_loader import get_db_connection, release_connection

        conn = None
        try:
            # --- Extract and validate room_id ---
            room_id = payload.get("room_id")
            if not room_id:
                parts = topic.split("/")
                if len(parts) >= 3:
                    room_id = parts[1]
            if not room_id:
                logger.error("❌ [ENERGY] Cannot determine room_id — message dropped")
                return

            # --- Extract fields; optional fields default to None (stored as NULL) ---
            voltage = float(payload.get("voltage", 0.0))
            current = float(payload.get("current", 0.0))
            power = float(payload.get("power", 0.0))

            energy_raw = payload.get("energy")
            frequency_raw = payload.get("frequency")
            pf_raw = payload.get("pf")

            energy = float(energy_raw) if energy_raw is not None else None
            frequency = float(frequency_raw) if frequency_raw is not None else None
            pf = float(pf_raw) if pf_raw is not None else None

            conn = get_db_connection()
            with conn.cursor() as cur:
                # -----------------------------------------------------------------
                # 0. [FIX] Look up the previous raw reading for this room BEFORE
                #    inserting the new one, so we can compute the elapsed time
                #    (delta_t) needed for trapezoidal energy integration.
                #    Read from the DB (not in-memory state) so this stays correct
                #    across service restarts / multiple instances.
                # -----------------------------------------------------------------
                cur.execute("""
                    SELECT power_watts, read_at
                    FROM power_sensors
                    WHERE room_id = %s
                    ORDER BY read_at DESC
                    LIMIT 1
                """, (room_id,))
                prev_row = cur.fetchone()

                # -----------------------------------------------------------------
                # 1. INSERT into power_sensors (real-time raw reading) — unchanged
                # -----------------------------------------------------------------
                sensor_id = "PWR" + uuid.uuid4().hex[:15].upper()
                cur.execute("""
                    INSERT INTO power_sensors
                        (sensor_id, room_id, voltage_v, current_a, power_watts, read_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (sensor_id, room_id, voltage, current, power))

                # -----------------------------------------------------------------
                # 2. [FIX] Compute incremental energy (kWh) using the trapezoidal
                #    rule: E = ((P_now + P_prev) / 2) * delta_t(hours) / 1000
                #    - If there is no previous reading (first message ever for
                #      this room), the increment is 0 — we cannot infer a
                #      duration for the very first sample.
                #    - If the gap since the previous reading exceeds
                #      MAX_INTEGRATION_GAP_HOURS, treat it as a connectivity
                #      gap and contribute 0 kWh for that interval, to avoid
                #      wildly overestimating consumption after downtime.
                # -----------------------------------------------------------------
                energy_increment_kwh = 0.0
                if prev_row:
                    prev_power, prev_time = prev_row
                    now_ts = datetime.datetime.now(datetime.timezone.utc)
                    prev_time_aware = (
                        prev_time if prev_time.tzinfo else
                        prev_time.replace(tzinfo=datetime.timezone.utc)
                    )
                    delta_hours = (now_ts - prev_time_aware).total_seconds() / 3600.0

                    if 0 < delta_hours <= MAX_INTEGRATION_GAP_HOURS:
                        avg_power = (power + float(prev_power)) / 2.0
                        energy_increment_kwh = (avg_power * delta_hours) / 1000.0

                # -----------------------------------------------------------------
                # 3. [FIX] REAL upsert into energy_logs using ON CONFLICT.
                #    total_watts now holds ACCUMULATED daily kWh (despite the
                #    legacy column name — consider renaming to energy_kwh in a
                #    future migration for clarity).
                #
                #    REQUIRES: UNIQUE (room_id, date) constraint — see
                #    migration_energy_logs_constraint.sql
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
                            %s, %s)
                    ON CONFLICT (room_id, date)
                    DO UPDATE SET
                        voltage      = EXCLUDED.voltage,
                        current      = EXCLUDED.current,
                        power        = EXCLUDED.power,
                        energy       = COALESCE(EXCLUDED.energy, energy_logs.energy),
                        frequency    = COALESCE(EXCLUDED.frequency, energy_logs.frequency),
                        power_factor = COALESCE(EXCLUDED.power_factor, energy_logs.power_factor),
                        total_watts  = energy_logs.total_watts + EXCLUDED.total_watts
                """, (
                    log_id, room_id, today,
                    voltage, current, power,
                    energy, frequency, pf,
                    energy_increment_kwh,
                    0
                ))

            conn.commit()

            logger.info(
                f"💾 [ENERGY] Room {room_id} | V={voltage}V I={current}A P={power}W | "
                f"+{energy_increment_kwh:.6f} kWh this interval"
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
    # CAMERA / INFERENCE HANDLERS (unchanged)
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
                if room_id in self._restored_rooms:
                    logger.info(f"📡 ESP32 in Room {room_id} reconnected, skip restore (already restored this session)")
                    return
                logger.info(f"📡 ESP32 in Room {room_id} is online! Triggering state restoration...")
                from app.boot_recovery import BootRecoveryManager
                from app.mqtt_commands import mqtt_commander
                recovery = BootRecoveryManager(mqtt_commander)
                recovery.restore_for_room(room_id)
                self._restored_rooms.add(room_id)
            except Exception as e:
                logger.error(f"❌ Error restoring state: {e}")

    def publish(self, topic: str, payload: dict):
        if isinstance(payload, (dict, list)):
            serialized_payload = json.dumps(payload)
        else:
            serialized_payload = payload

        result = self.client.publish(topic, serialized_payload, qos=1)
        rc = getattr(result, "rc", None)
        if rc != mqtt.MQTT_ERR_SUCCESS:
            logger.error(f"❌ Failed to publish to {topic} (rc={rc})")
            return False

        logger.info(f"📤 Published to {topic}: {payload}")
        return True

    def start(self):
        if getattr(self, "started", False):
            return True

        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
            self.started = True
            logger.info("🚀 MQTT Subscriber started")
            return True
        except Exception as e:
            logger.error(f"❌ MQTT connection error: {e}")
            raise

    def stop(self):
        if not getattr(self, "started", False):
            return

        self.client.loop_stop()
        self.client.disconnect()
        self.started = False
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