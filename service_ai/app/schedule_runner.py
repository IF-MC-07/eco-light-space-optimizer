import os
import re
import time
import logging
from datetime import datetime, time as dt_time
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

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
        # Tracking ON trigger timestamps for No-Show Eco check
        # Key: schedule_id -> { "room_id": str, "s_name": str, "timestamp": float, "checked": bool, "date": str }
        self.schedule_on_timestamps = {}

    def run(self):
        """
        Main loop for schedule runner. Polls the database every 15 seconds.
        """
        logger.info("⏰ Schedule Runner Background Thread Started.")
        while True:
            try:
                self.process_schedules()
            except Exception as e:
                logger.error(f"❌ Error in ScheduleRunner process_schedules: {e}")
            
            # Sleep for 15 seconds to ensure fast schedule detection
            time.sleep(15)

    def _convert_time_to_seconds(self, t) -> int:
        """
        Converts a time object or string to seconds from midnight.
        """
        if isinstance(t, str):
            try:
                parts = list(map(int, t.split(':')))
                if len(parts) == 3:
                    return parts[0] * 3600 + parts[1] * 60 + parts[2]
                elif len(parts) == 2:
                    return parts[0] * 3600 + parts[1] * 60
            except ValueError:
                pass
        elif isinstance(t, (dt_time, datetime)):
            return t.hour * 3600 + t.minute * 60 + t.second
        
        return 0

    def _is_schedule_active_today(self, schedule_days: str, s_name: str, now_dt: datetime) -> bool:
        """
        Checks if the schedule applies to today.
        Priority:
          1. schedule_days column (e.g. 'MON,TUE,WED,THU,FRI') — primary source
          2. Day tags in schedule_name (e.g. '[THU]') — fallback when schedule_days is NULL
          3. If neither is set, returns True (applies every day).
        """
        import re
        day_map = {
            "MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5, "SUN": 6
        }
        current_weekday = now_dt.weekday()  # 0 = Mon, 6 = Sun

        # --- Priority 1: schedule_days column ---
        if schedule_days:
            active_days = [d.strip().upper() for d in schedule_days.split(',') if d.strip()]
            if active_days:
                return any(day_map.get(d) == current_weekday for d in active_days)

        # --- Priority 2: Day tags in schedule name ---
        if s_name:
            tags = re.findall(r'\[([A-Z]{3})\]', s_name.upper())
            if tags:
                return any(day_map.get(t) == current_weekday for t in tags)

        # --- No restriction: runs every day ---
        return True

    def _check_room_occupancy_since(self, cur, room_id: str, start_timestamp: float) -> bool:
        """
        Checks if real human presence was detected in room_id since start_timestamp.
        Evaluates statistics per-zone rather than room total to avoid ratio dilution
        when a human is present in only 1 zone.
        If ANY single zone has >= 3 positive detection logs AND >= 15% positive ratio,
        it is considered real human presence.
        """
        try:
            elapsed_seconds = time.time() - start_timestamp

            # Query positive logs and total logs per zone for this room
            cur.execute("""
                SELECT 
                    z.zone_name,
                    COUNT(dl.detection_id) AS total_zone_logs,
                    COUNT(CASE WHEN dl.occupancy_count > 0 THEN 1 END) AS positive_zone_logs
                FROM zones z
                LEFT JOIN detection_logs dl ON z.zone_id = dl.zone_id 
                    AND dl.detection_time >= (NOW() - (%s * INTERVAL '1 second'))
                WHERE z.room_id = %s AND z.zone_status = 'aktif'
                GROUP BY z.zone_id, z.zone_name
            """, (elapsed_seconds, room_id))
            
            zone_stats = cur.fetchall()
            
            MIN_POSITIVE_LOGS_PER_ZONE = 3
            MIN_ZONE_RATIO = 0.15
            
            has_presence = False
            details = []
            
            for z_name, total_zone_logs, pos_zone_logs in zone_stats:
                total_zone_logs = total_zone_logs or 0
                pos_zone_logs = pos_zone_logs or 0
                ratio = (pos_zone_logs / total_zone_logs) if total_zone_logs > 0 else 0.0
                
                details.append(f"{z_name}: {pos_zone_logs}/{total_zone_logs} ({ratio:.1%})")
                
                if pos_zone_logs >= MIN_POSITIVE_LOGS_PER_ZONE and ratio >= MIN_ZONE_RATIO:
                    has_presence = True
                    
            status_str = "ADA ORANG (Lampu tetap ON)" if has_presence else "KOSONG (Lampu dimatikan)"
            logger.info(
                f"🔍 [NO-SHOW ECO] Room '{room_id}' (sejak {elapsed_seconds:.1f}s lalu) Per-Zone: "
                f"[{', '.join(details)}] → {status_str}"
            )
            return has_presence

        except Exception as e:
            logger.error(f"❌ Error checking occupancy since schedule start: {e}")
            return True

    def process_schedules(self):
        """
        Polls DB and executes schedule logic.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # Fetch all schedules including schedule_days
                cur.execute("""
                    SELECT schedule_id, room_id, schedule_name, start_time, end_time,
                           COALESCE(schedule_days, '') AS schedule_days
                    FROM automation_schedules
                """)
                schedules = cur.fetchall()

                now_dt = datetime.now()
                today_str = now_dt.strftime("%Y-%m-%d")
                now_seconds = now_dt.hour * 3600 + now_dt.minute * 60 + now_dt.second

                for s in schedules:
                    schedule_id, room_id, s_name, start_time, end_time, schedule_days = s
                    
                    # Check if this schedule is active today (via schedule_days or name tags)
                    if not self._is_schedule_active_today(schedule_days, s_name, now_dt):
                        logger.debug(f"⏭️  Schedule '{s_name}' skipped — not active today.")
                        continue

                    # Convert start/end times to seconds from midnight
                    start_seconds = self._convert_time_to_seconds(start_time)
                    end_seconds = self._convert_time_to_seconds(end_time)

                    # Check if manual override lockout is active for this room (last 5 minutes)
                    last_manual = last_manual_command_time.get(room_id, 0.0)
                    manual_lockout = (time.time() - last_manual) < 300.0

                    if manual_lockout:
                        remaining = 300.0 - (time.time() - last_manual)
                        logger.info(
                            f"⏳ [LOCKOUT] Room {room_id} masih dalam manual lockout selama {remaining:.0f} detik lagi. "
                            f"Schedule '{s_name}' (ID {schedule_id}) DILEWATI."
                        )
                        continue

                    # Determine if current time falls within schedule duration
                    if start_seconds <= now_seconds <= end_seconds:
                        # 🟢 TURN ON Trigger
                        # Verify it hasn't been triggered today
                        if self.triggered_on.get(schedule_id) != today_str:
                            logger.info(f"🔔 Triggering schedule '{s_name}' (ID {schedule_id}) ON for Room {room_id}")
                            self._trigger_room_devices(room_id, "ON")
                            self.triggered_on[schedule_id] = today_str
                            
                            # Record trigger timestamp for No-Show Eco check
                            self.schedule_on_timestamps[schedule_id] = {
                                "room_id": room_id,
                                "s_name": s_name,
                                "timestamp": time.time(),
                                "checked": False,
                                "date": today_str
                            }
                            
                            # Clear OFF trigger for today
                            if schedule_id in self.triggered_off:
                                self.triggered_off.pop(schedule_id)
                                
                    elif 0 <= (now_seconds - end_seconds) <= 120:
                        # 🔴 TURN OFF Trigger
                        # Verify it hasn't been triggered today
                        if self.triggered_off.get(schedule_id) != today_str:
                            logger.info(f"🔔 Triggering schedule '{s_name}' (ID {schedule_id}) OFF for Room {room_id}")
                            self._trigger_room_devices(room_id, "OFF")
                            self.triggered_off[schedule_id] = today_str
                            
                            # Clear ON trigger for today
                            if schedule_id in self.triggered_on:
                                self.triggered_on.pop(schedule_id)

                # --- Check Schedule No-Show Eco Auto-OFF ---
                no_show_minutes = float(os.getenv("SCHEDULE_NO_SHOW_MINUTES", "2"))
                no_show_seconds = no_show_minutes * 60.0
                now_time = time.time()

                for sched_id, info in list(self.schedule_on_timestamps.items()):
                    if info["date"] != today_str:
                        continue
                    if not info["checked"] and (now_time - info["timestamp"]) >= no_show_seconds:
                        room_id = info["room_id"]
                        s_name = info["s_name"]
                        has_occupancy = self._check_room_occupancy_since(cur, room_id, info["timestamp"])

                        if not has_occupancy:
                            logger.info(
                                f"🍃 [NO-SHOW ECO] Tidak ada orang terdeteksi {no_show_minutes:.0f} menit setelah "
                                f"jadwal '{s_name}' (ID {sched_id}) dimulai. Mematikan lampu Room {room_id} untuk menghemat energi."
                            )
                            self._trigger_room_devices(room_id, "OFF")
                            self._sync_decision_engine(room_id, "OFF")
                        else:
                            logger.info(
                                f"👥 [SCHEDULE ECO] Terdeteksi kehadiran orang di Room {room_id} setelah jadwal '{s_name}' dimulai. Lampu tetap ON."
                            )

                        info["checked"] = True

        except Exception as e:
            logger.error(f"❌ DB Error in ScheduleRunner process_schedules: {e}")
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def _sync_decision_engine(self, room_id: str, status: str):
        """
        Syncs decision_engine's internal zone states to status ('ON' or 'OFF')
        so decision_engine stays aligned with Schedule triggers.
        """
        try:
            from app.decision_engine import decision_engine
            decision_engine.sync_room_zone_statuses(room_id, status)
        except Exception as e:
            logger.error(f"❌ Error syncing decision_engine states: {e}")

    def _trigger_room_devices(self, room_id: str, command: str):
        """
        Turns all lights and AC devices ON or OFF for the given room.
        """
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT d.device_id, d.type, lc.relay_channel, lc.zone_id, z.zone_name
                    FROM iot_devices d
                    LEFT JOIN light_controls lc ON d.device_id = lc.device_id
                    LEFT JOIN zones z ON lc.zone_id = z.zone_id
                    WHERE d.room_id = %s
                """, (room_id,))
                devices = cur.fetchall()

                logger.info(f"🔍 [SCHEDULE] Found {len(devices)} device row(s) for room '{room_id}'")

                for dev in devices:
                    dev_id, dev_type, relay_channel, zone_id, zone_name = dev
                    normalized_type = (dev_type or "").strip().lower()
                    logger.info(f"🔍 [SCHEDULE] Device {dev_id} | Type: '{dev_type}' | Relay Channel: {relay_channel}")

                    is_light = (
                        relay_channel is not None
                        or normalized_type in ('light', 'lighting', 'lamp', 'lampu', 'esp32', 'relay', 'light_4ch', 'switch')
                        or 'light' in normalized_type
                        or 'lamp' in normalized_type
                        or 'relay' in normalized_type
                        or 'esp' in normalized_type
                    )

                    if is_light:
                        if relay_channel is None:
                            logger.error(
                                f"❌ [SCHEDULE] Device {dev_id} bertipe '{dev_type}' TIDAK memiliki "
                                f"baris di light_controls (relay_channel NULL). Command DIBATALKAN "
                                f"untuk device ini — tidak menggunakan channel default agar tidak "
                                f"salah memicu relay fisik yang salah."
                            )
                            continue

                        z_id = zone_id if zone_id is not None else 0
                        z_name = zone_name if zone_name is not None else "Unknown"

                        mqtt_commander.send_light_command(
                            room_id=room_id,
                            relay_channel=relay_channel,
                            command=command,
                            zone_id=z_id,
                            zone_name=z_name,
                            source="schedule"
                        )

                        cur.execute("""
                            UPDATE light_controls
                            SET light_status = %s, updated_at = NOW()
                            WHERE device_id = %s AND relay_channel = %s
                        """, (command, dev_id, relay_channel))

                        logger.info(
                            f"✅ [SCHEDULE] Light command '{command}' terkirim -> "
                            f"room={room_id}, device={dev_id}, channel={relay_channel}"
                        )

                    elif normalized_type == 'ac':
                        cur.execute("""
                            SELECT COALESCE(temperature_setting, 22.0)
                            FROM ac_controls
                            WHERE device_id = %s
                            LIMIT 1
                        """, (dev_id,))
                        ac_row = cur.fetchone()
                        temp = ac_row[0] if ac_row else 22.0

                        mqtt_commander.send_ac_command(
                            room_id=room_id,
                            command=command,
                            temperature=temp,
                            source="schedule"
                        )

                        cur.execute("""
                            UPDATE ac_controls
                            SET ac_status = %s, updated_at = NOW()
                            WHERE device_id = %s
                        """, (command, dev_id))

                    else:
                        logger.info(
                            f"⚠️ [SCHEDULE] Device {dev_id} type='{dev_type}' bukan light/ac, dilewati."
                        )

                conn.commit()
                self._sync_decision_engine(room_id, command)
                logger.info(f"💾 Status device untuk Room {room_id} diperbarui menjadi {command}")

        except Exception as e:
            logger.error(f"❌ Error triggering devices for Room {room_id}: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)