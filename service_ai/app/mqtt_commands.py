import json
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

### Import dependencies
try:
    from app.mqtt_subscriber import mqtt_client
    from app.zona_loader import get_db_connection
    from app.simulation_guard import is_simulated_room
except ImportError:
    from mqtt_subscriber import mqtt_client
    from zona_loader import get_db_connection
    from simulation_guard import is_simulated_room

load_dotenv()
logger = logging.getLogger(__name__)

class MQTTCommander:
    def send_light_command(self, room_id: str, relay_channel: int, command: str, zone_id: int, zone_name: str, source: str = "ai_decision"):
        """
        Sends light control command to ESP32 via MQTT.
        Topic: devices/{room_id}/light/{relay_channel}
        """
        if is_simulated_room(room_id):
            logger.info(f"🚫 [DSLB Guard] Skipping light command for simulated room {room_id} (channel {relay_channel})")
            return

        topic = f"devices/{room_id}/light/{relay_channel}"
        payload = {
            "command": command,
            "zone_id": zone_id,
            "zone_name": zone_name,
            "relay_channel": relay_channel,
            "source": source,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }

        try:
            if mqtt_client.publish(topic, payload):
                logger.info(f"💡 Light command published to {topic}: {payload}")
            else:
                logger.error(f"❌ Light command publish failed for {topic}")
        except Exception as e:
            logger.error(f"❌ Failed to publish light command: {e}")

    def send_ac_command(self, room_id: str, command: str, temperature: float, source: str = "ai_decision"):
        """
        Sends AC control command to ESP32 via MQTT.
        Topic: devices/{room_id}/ac
        """
        if is_simulated_room(room_id):
            logger.info(f"🚫 [DSLB Guard] Skipping AC command for simulated room {room_id}")
            return

        topic = f"devices/{room_id}/ac"
        payload = {
            "command": command,
            "room_id": room_id,
            "temperature": float(temperature) if temperature is not None else 24.0,
            "source": source,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        try:
            if mqtt_client.publish(topic, payload):
                logger.info(f"❄️ AC command published to {topic}: {payload}")
            else:
                logger.error(f"❌ AC command publish failed for {topic}")
        except Exception as e:
            logger.error(f"❌ Failed to publish AC command: {e}")

    def request_status(self, room_id: str):
        """
        Sends a request to ESP32 to get current status.
        Topic: devices/{room_id}/status/request
        """
        if is_simulated_room(room_id):
            logger.info(f"🚫 [DSLB Guard] Skipping status request for simulated room {room_id}")
            return

        topic = f"devices/{room_id}/status/request"
        payload = {
            "room_id": room_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        try:
            if mqtt_client.publish(topic, payload):
                logger.info(f"❓ Requested device status on topic {topic}")
            else:
                logger.error(f"❌ Status request publish failed for {topic}")
        except Exception as e:
            logger.error(f"❌ Failed to publish status request: {e}")

    def handle_status_response(self, payload: dict):
        """
        Handles status response from ESP32 and updates the database tables
        light_controls and ac_controls.
        """
        if not isinstance(payload, dict):
            try:
                payload = json.loads(payload)
            except Exception as e:
                logger.error(f"❌ Failed to parse status response payload: {e}")
                return

        room_id = payload.get("room_id")
        if room_id is None:
            logger.error("❌ Status response payload missing room_id")
            return

        lights = payload.get("lights", [])
        ac_status = payload.get("ac_status")
        temperature = payload.get("temperature")

        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # Update lights
                for light in lights:
                    relay_channel = light.get("relay_channel")
                    status = light.get("status")
                    if relay_channel is not None and status is not None:
                        cur.execute("""
                            UPDATE light_controls
                            SET light_status = %s, updated_at = NOW()
                            WHERE relay_channel = %s AND zone_id IN (
                                SELECT zone_id FROM zones WHERE room_id = %s
                            )
                        """, (status, relay_channel, room_id))
                        if cur.rowcount == 0:
                            logger.warning(f"⚠️ 0 rows updated for light_controls: Room {room_id}, Relay {relay_channel} -> {status} (Not found in DB)")
                        else:
                            logger.info(f"💾 Updated light status in DB: Room {room_id}, Relay {relay_channel} -> {status}")

                # Update AC
                if ac_status is not None:
                    if temperature is not None:
                        cur.execute("""
                            UPDATE ac_controls
                            SET ac_status = %s, temperature_setting = %s, updated_at = NOW()
                            WHERE room_id = %s
                        """, (ac_status, temperature, room_id))
                    else:
                        cur.execute("""
                            UPDATE ac_controls
                            SET ac_status = %s, updated_at = NOW()
                            WHERE room_id = %s
                        """, (ac_status, room_id))
                        
                    if cur.rowcount == 0:
                        logger.warning(f"⚠️ 0 rows updated for ac_controls: Room {room_id} -> {ac_status} (Temp: {temperature}) (Not found in DB)")
                    else:
                        logger.info(f"💾 Updated AC status in DB: Room {room_id} -> {ac_status} (Temp: {temperature})")

                conn.commit()
        except Exception as e:
            logger.error(f"❌ DB Error in handle_status_response: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

# Create a singleton instance of MQTTCommander
mqtt_commander = MQTTCommander()
