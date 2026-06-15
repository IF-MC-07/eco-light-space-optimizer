import os
import time
import logging
from datetime import datetime, time as dt_time
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from app.zona_loader import get_db_connection

try:
    from app.mqtt_commands import mqtt_commander
except ImportError:
    from mqtt_commands import mqtt_commander

load_dotenv()
logger = logging.getLogger(__name__)

# Shared dictionary to track the last manual command time per room
# Key: room_id (int) -> Value: timestamp (float)
last_manual_command_time = {}

class ScheduleRunner:
    def __init__(self):
        # Tracking triggered schedules to prevent multiple triggers within the same minute or day
        # Key: schedule_id -> "ON" or "OFF" -> date string "YYYY-MM-DD"
        self.triggered_on = {}
        self.triggered_off = {}

    def run(self):
        """
        Main loop for schedule runner. Polls the database every 60 seconds.
        """
        logger.info("⏰ Schedule Runner Background Thread Started.")
        while True:
            try:
                self.process_schedules()
            except Exception as e:
                logger.error(f"❌ Error in ScheduleRunner process_schedules: {e}")
            
            # Sleep for 60 seconds
            time.sleep(60)

    def _convert_time_to_seconds(self, t) -> int:
        """
        Converts a time object or string to seconds from midnight.
        """
        if isinstance(t, str):
            try:
                # Handle HH:MM:SS or HH:MM format
                parts = list(map(int, t.split(':')))
                if len(parts) == 3:
                    return parts[0] * 3600 + parts[1] * 60 + parts[2]
                elif len(parts) == 2:
                    return parts[0] * 3600 + parts[1] * 60
            except ValueError:
                pass
        elif isinstance(t, (dt_time, datetime)):
            return t.hour * 3600 + t.minute * 60 + t.second
        
        # Fallback to 0 if not parsable
        return 0

    def process_schedules(self):
        """
        Polls DB and executes schedule logic.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # Fetch all schedules
                cur.execute("""
                    SELECT schedule_id, room_id, schedule_name, start_time, end_time 
                    FROM automation_schedules
                """)
                schedules = cur.fetchall()

                now_dt = datetime.now()
                today_str = now_dt.strftime("%Y-%m-%d")
                now_seconds = now_dt.hour * 3600 + now_dt.minute * 60 + now_dt.second

                for s in schedules:
                    schedule_id, room_id, s_name, start_time, end_time = s
                    
                    # Convert start/end times to seconds from midnight
                    start_seconds = self._convert_time_to_seconds(start_time)
                    end_seconds = self._convert_time_to_seconds(end_time)

                    # Check if manual override lockout is active for this room (last 5 minutes)
                    last_manual = last_manual_command_time.get(room_id, 0.0)
                    manual_lockout = (time.time() - last_manual) < 300.0

                    if manual_lockout:
                        logger.info(f"⏳ Room {room_id} has active manual lockout. Skipping schedule '{s_name}'.")
                        continue

                    # Determine if current time falls within schedule duration
                    if start_seconds <= now_seconds <= end_seconds:
                        # 🟢 TURN ON Trigger
                        # Verify it hasn't been triggered today
                        if self.triggered_on.get(schedule_id) != today_str:
                            logger.info(f"🔔 Triggering schedule '{s_name}' (ID {schedule_id}) ON for Room {room_id}")
                            self._trigger_room_devices(room_id, "ON")
                            self.triggered_on[schedule_id] = today_str
                            
                            # Clear OFF trigger for today
                            if schedule_id in self.triggered_off:
                                self.triggered_off.pop(schedule_id)
                                
                    elif 0 <= (now_seconds - end_seconds) <= 60:
                        # 🔴 TURN OFF Trigger
                        # Verify it hasn't been triggered today
                        if self.triggered_off.get(schedule_id) != today_str:
                            logger.info(f"🔔 Triggering schedule '{s_name}' (ID {schedule_id}) OFF for Room {room_id}")
                            self._trigger_room_devices(room_id, "OFF")
                            self.triggered_off[schedule_id] = today_str
                            
                            # Clear ON trigger for today
                            if schedule_id in self.triggered_on:
                                self.triggered_on.pop(schedule_id)

        except Exception as e:
            logger.error(f"❌ DB Error in ScheduleRunner process_schedules: {e}")
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def _trigger_room_devices(self, room_id: int, command: str):
        """
        Turns all lights and AC devices ON or OFF for the given room.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # Fetch all devices for this room
                cur.execute("""
                    SELECT d.device_id, d.type, lc.relay_channel, lc.zone_id, z.zone_name
                    FROM iot_devices d
                    LEFT JOIN light_controls lc ON d.device_id = lc.device_id
                    LEFT JOIN zones z ON lc.zone_id = z.zone_id
                    WHERE d.room_id = %s
                """, (room_id,))
                devices = cur.fetchall()

                for dev in devices:
                    dev_id, dev_type, relay_channel, zone_id, zone_name = dev
                    
                    if dev_type == 'light':
                        # Ensure relay_channel is present
                        r_chan = relay_channel if relay_channel is not None else 1
                        z_id = zone_id if zone_id is not None else 0
                        z_name = zone_name if zone_name is not None else "Unknown"

                        # Send MQTT light command
                        mqtt_commander.send_light_command(
                            room_id=room_id,
                            relay_channel=r_chan,
                            command=command,
                            zone_id=z_id,
                            zone_name=z_name,
                            source="schedule"
                        )
                        
                        # Update light_controls table in DB
                        cur.execute("""
                            UPDATE light_controls
                            SET light_status = %s, updated_at = NOW()
                            WHERE device_id = %s
                        """, (command, dev_id))
                        
                    elif dev_type == 'ac':
                        # Fetch AC settings
                        cur.execute("""
                            SELECT COALESCE(temperature_setting, 22.0)
                            FROM ac_controls
                            WHERE device_id = %s
                            LIMIT 1
                        """, (dev_id,))
                        ac_row = cur.fetchone()
                        temp = ac_row[0] if ac_row else 22.0

                        # Send MQTT AC command
                        mqtt_commander.send_ac_command(
                            room_id=room_id,
                            command=command,
                            temperature=temp,
                            source="schedule"
                        )

                        # Update ac_controls table in DB
                        cur.execute("""
                            UPDATE ac_controls
                            SET ac_status = %s, updated_at = NOW()
                            WHERE device_id = %s
                        """, (command, dev_id))
                
                conn.commit()
                logger.info(f"💾 Updated device statuses in DB for Room {room_id} to {command}")

        except Exception as e:
            logger.error(f"❌ Error triggering devices for Room {room_id}: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)
