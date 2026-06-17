import os
import time
import logging

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

try:
    from app.mqtt_commands import MQTTCommander
except ImportError:
    from mqtt_commands import MQTTCommander

try:
    from app.db_state import ensure_device_states_exist
except ImportError:
    from db_state import ensure_device_states_exist

log = logging.getLogger(__name__)
BOOT_RECOVERY_DELAY = float(os.getenv("BOOT_RECOVERY_DELAY", 15))

class BootRecoveryManager:
    def __init__(self, mqtt_commander: MQTTCommander):
        self.commander = mqtt_commander

    def run(self):
        log.info("🔄 Boot recovery starting...")
        
        # Call ensure_device_states_exist at the START of boot recovery,
        # before any restoration, to guarantee rows exist.
        try:
            ensure_device_states_exist()
        except Exception as e:
            log.error(f"❌ Error during ensure_device_states_exist: {e}")

        # Wait N seconds after MQTT connects before sending restore commands
        # Gives ESP32 time to boot and subscribe to topics
        log.info(f"⏳ Waiting for BOOT_RECOVERY_DELAY = {BOOT_RECOVERY_DELAY} seconds...")
        time.sleep(BOOT_RECOVERY_DELAY)
        
        rooms = self._get_all_rooms()
        for room in rooms:
            room_id = room['room_id']
            log.info(f"🔄 Recovering room state for room_id: {room_id}")
            self.restore_for_room(room_id)

    def restore_for_room(self, room_id: str):
        schedule_active = self._check_active_schedule(room_id)
        if schedule_active:
            log.info(f"📅 Room {room_id}: active schedule found → restore ON")
            self._restore_from_schedule(room_id)
        else:
            log.info(f"💾 Room {room_id}: no schedule → restore from DB state")
            self._restore_from_db(room_id)

    def _get_all_rooms(self) -> list:
        """SELECT room_id, room_name FROM rooms WHERE status = 'ACTIVE'"""
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT room_id, room_name FROM rooms WHERE LOWER(status) = 'aktif'")
                rows = cur.fetchall()
                return [{"room_id": row[0], "room_name": row[1]} for row in rows]
        except Exception as e:
            log.error(f"❌ Error fetching rooms: {e}")
            return []
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def _check_active_schedule(self, room_id: str) -> bool:
        """
        SELECT COUNT(*) FROM automation_schedules
        WHERE room_id = %s
        AND CURRENT_TIME BETWEEN start_time AND end_time
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*) FROM automation_schedules
                    WHERE room_id = %s
                    AND CURRENT_TIME BETWEEN start_time AND end_time
                """, (room_id,))
                count = cur.fetchone()[0]
                return count > 0
        except Exception as e:
            log.error(f"❌ Error checking active schedule for Room {room_id}: {e}")
            return False
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def _restore_from_schedule(self, room_id: str):
        """
        Turn ON all lights and AC for this room.
        Query light_controls JOIN zones JOIN iot_devices for relay channels.
        Send send_light_command(..., command='ON', source='boot_recovery')
        Send send_ac_command(..., command='ON', source='boot_recovery')
        Also update light_controls.light_status and ac_controls.ac_status in DB.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # 1. Turn ON lights
                cur.execute("""
                    SELECT lc.relay_channel, lc.zone_id, z.zone_name, lc.device_id
                    FROM light_controls lc
                    JOIN zones z ON lc.zone_id = z.zone_id
                    WHERE z.room_id = %s
                """, (room_id,))
                lights = cur.fetchall()
                for row in lights:
                    relay_channel, zone_id, zone_name, device_id = row
                    relay_chan = relay_channel if relay_channel is not None else 1
                    
                    self.commander.send_light_command(
                        room_id=room_id,
                        relay_channel=relay_chan,
                        command="ON",
                        zone_id=zone_id,
                        zone_name=zone_name,
                        source="boot_recovery"
                    )
                    
                    # Update DB
                    cur.execute("""
                        UPDATE light_controls
                        SET light_status = 'ON', updated_at = NOW()
                        WHERE device_id = %s
                    """, (device_id,))
                
                # 2. Turn ON AC
                cur.execute("""
                    SELECT device_id, COALESCE(temperature_setting, 22.0)
                    FROM ac_controls
                    WHERE room_id = %s
                """, (room_id,))
                acs = cur.fetchall()
                for row in acs:
                    device_id, temp = row
                    self.commander.send_ac_command(
                        room_id=room_id,
                        command="ON",
                        temperature=temp,
                        source="boot_recovery"
                    )
                    
                    # Update DB
                    cur.execute("""
                        UPDATE ac_controls
                        SET ac_status = 'ON', updated_at = NOW()
                        WHERE device_id = %s
                    """, (device_id,))
                
                conn.commit()
                log.info(f"🟢 Successfully restored active schedule (ON) state for Room {room_id}")
        except Exception as e:
            log.error(f"❌ Error restoring from schedule for Room {room_id}: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def _restore_from_db(self, room_id: str):
        """
        Read current light_controls.light_status and ac_controls.ac_status from DB.
        For each device, send the command matching its last known DB state.
        source='boot_recovery'
        If status is NULL → treat as OFF.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # 1. Restore lights
                cur.execute("""
                    SELECT lc.relay_channel, lc.zone_id, z.zone_name, COALESCE(lc.light_status, 'OFF')
                    FROM light_controls lc
                    JOIN zones z ON lc.zone_id = z.zone_id
                    WHERE z.room_id = %s
                """, (room_id,))
                lights = cur.fetchall()
                for row in lights:
                    relay_channel, zone_id, zone_name, status = row
                    relay_chan = relay_channel if relay_channel is not None else 1
                    status_str = status if status else "OFF"
                    
                    self.commander.send_light_command(
                        room_id=room_id,
                        relay_channel=relay_chan,
                        command=status_str,
                        zone_id=zone_id,
                        zone_name=zone_name,
                        source="boot_recovery"
                    )
                
                # 2. Restore AC
                cur.execute("""
                    SELECT COALESCE(ac_status, 'OFF'), COALESCE(temperature_setting, 22.0)
                    FROM ac_controls
                    WHERE room_id = %s
                """, (room_id,))
                acs = cur.fetchall()
                for row in acs:
                    status, temp = row
                    status_str = status if status else "OFF"
                    
                    self.commander.send_ac_command(
                        room_id=room_id,
                        command=status_str,
                        temperature=temp,
                        source="boot_recovery"
                    )
                
                log.info(f"💾 Successfully restored last known DB state for Room {room_id}")
        except Exception as e:
            log.error(f"❌ Error restoring from DB state for Room {room_id}: {e}")
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)
