import os
import time
import logging
from dotenv import load_dotenv
import threading

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

class DecisionEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self.zone_states = {}
        self.ac_states = {}
        self._camera_room_cache = {}
        self._initialized_cameras = set()
        self.delay_on_light = float(os.getenv("DELAY_ON_LIGHT_SECONDS", 5))
        self.delay_on_ac_minutes = float(os.getenv("DELAY_ON_AC_MINUTES", 3))
        self.delay_on_ac_seconds = self.delay_on_ac_minutes * 60
        self.delay_off_minutes = float(os.getenv("DELAY_OFF_MINUTES", 5))
        self.delay_off_seconds = self.delay_off_minutes * 60
        self.compressor_protection_seconds = float(
            os.getenv("COMPRESSOR_PROTECTION_SECONDS", 180)
        )
        logger.info(
            f"⚙️ Decision Engine Initialized - ON Light: {self.delay_on_light}s | "
            f"ON AC: {self.delay_on_ac_minutes}min ({self.delay_on_ac_seconds:.0f}s) | "
            f"OFF: {self.delay_off_minutes}min ({self.delay_off_seconds:.0f}s) | "
            f"Compressor protection: {self.compressor_protection_seconds:.0f}s"
        )

    def _initialize_camera_states(self, camera_id: str):
        if camera_id in self._initialized_cameras:
            return

        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT room_id FROM cameras WHERE camera_id = %s", (camera_id,))
                room_row = cur.fetchone()
                if not room_row:
                    return
                room_id = room_row[0]
                self._camera_room_cache[camera_id] = room_id

                # Load zones + status
                cur.execute("""
                    SELECT z.zone_id, z.zone_name, COALESCE(lc.light_status, 'OFF')
                    FROM zones z
                    LEFT JOIN light_controls lc ON z.zone_id = lc.zone_id
                    WHERE z.room_id = %s AND z.zone_status = 'aktif'
                """, (room_id,))
                for row in cur.fetchall():
                    z_id, z_name, status = row
                    if z_id not in self.zone_states:
                        self.zone_states[z_id] = {
                            "zone_id": z_id,
                            "zone_name": z_name,
                            "room_id": room_id,
                            "current_status": (status or "OFF").upper(),
                            "occupied_since": None,
                            "empty_since": None
                        }
                # Load AC
                if room_id not in self.ac_states:
                    cur.execute("SELECT COALESCE(ac_status, 'OFF') FROM ac_controls WHERE room_id = %s LIMIT 1", (room_id,))
                    ac_row = cur.fetchone()
                    self.ac_states[room_id] = {
                        "room_id": room_id,
                        "current_status": (ac_row[0] if ac_row else "OFF").upper(),
                        "occupied_since": None,
                        "empty_since": None,
                        "last_turned_off": None,
                    }

                self._initialized_cameras.add(camera_id)

        except Exception as e:
            logger.error(f"❌ Init state error: {e}")
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def process_inference(self, camera_id: str, occupancy_counts: dict):
        with self._lock:
            self._initialize_camera_states(camera_id)

            room_id = self._camera_room_cache.get(camera_id)
            if not room_id:
                return

            conn = None
            try:
                conn = get_db_connection()
                with conn.cursor() as cur:
                    active_room_zones = [z for z in self.zone_states.values() if z["room_id"] == room_id]
                    now = time.time()

                    room_occupied = any(
                        occupancy_counts.get(z["zone_name"], 0) > 0
                        for z in active_room_zones
                    )

                    for zone in active_room_zones:
                        z_id = zone["zone_id"]
                        z_name = zone["zone_name"]
                        count = occupancy_counts.get(z_name, 0)

                        zone.setdefault("pending_on", False)
                        zone.setdefault("pending_off", False)

                        logger.debug(f"[STATE] Zone {z_name} | Count: {count} | Status: {zone['current_status']}")

                        if count > 0:
                            zone["empty_since"] = None
                            zone["pending_off"] = False

                            if zone["current_status"] == "OFF":
                                if zone["occupied_since"] is None:
                                    zone["occupied_since"] = now
                                    zone["pending_on"] = True
                                    logger.debug(f"[OCCUPIED] Zone {z_name} mulai terdeteksi")

                                elapsed = now - zone["occupied_since"]

                                if elapsed >= self.delay_on_light:
                                    cur.execute("SELECT relay_channel FROM light_controls WHERE zone_id = %s LIMIT 1", (z_id,))
                                    relay_row = cur.fetchone()
                                    relay_channel = relay_row[0] if relay_row and relay_row[0] is not None else 1

                                    mqtt_commander.send_light_command(
                                        room_id=room_id, relay_channel=relay_channel, command="ON",
                                        zone_id=z_id, zone_name=z_name, source="ai_decision"
                                    )
                                    zone["current_status"] = "ON"
                                    zone["occupied_since"] = None
                                    zone["pending_on"] = False

                                    cur.execute("UPDATE light_controls SET light_status = 'ON', updated_at = NOW() WHERE zone_id = %s", (z_id,))
                                    conn.commit()
                                    logger.info(f"🟢 Lampu ON - Zone '{z_name}' (Relay {relay_channel})")

                        else:
                            zone["occupied_since"] = None
                            zone["pending_on"] = False

                            if zone["current_status"] == "ON":
                                if zone["empty_since"] is None:
                                    zone["empty_since"] = now
                                    zone["pending_off"] = True
                                    logger.debug(f"[EMPTY] Zone {z_name} mulai kosong")

                                elapsed = now - zone["empty_since"]

                                if elapsed >= self.delay_off_seconds:
                                    cur.execute("SELECT relay_channel FROM light_controls WHERE zone_id = %s LIMIT 1", (z_id,))
                                    relay_row = cur.fetchone()
                                    relay_channel = relay_row[0] if relay_row and relay_row[0] is not None else 1

                                    mqtt_commander.send_light_command(
                                        room_id=room_id, relay_channel=relay_channel, command="OFF",
                                        zone_id=z_id, zone_name=z_name, source="ai_decision"
                                    )
                                    zone["current_status"] = "OFF"
                                    zone["empty_since"] = None
                                    zone["pending_off"] = False

                                    cur.execute("UPDATE light_controls SET light_status = 'OFF', updated_at = NOW() WHERE zone_id = %s", (z_id,))
                                    conn.commit()
                                    logger.info(f"🔴 Lampu OFF - Zone '{z_name}' (Relay {relay_channel})")

                    # ── AC logic ─────────────────────────────────────────────────
                    ac_state = self.ac_states.get(room_id)
                    if ac_state is not None:
                        ac_state.setdefault("occupied_since", None)
                        ac_state.setdefault("empty_since", None)
                        ac_state.setdefault("last_turned_off", None)

                        if room_occupied:
                            ac_state["empty_since"] = None

                            if ac_state["current_status"] == "OFF":
                                if ac_state["occupied_since"] is None:
                                    ac_state["occupied_since"] = now

                                elapsed_occ = now - ac_state["occupied_since"]

                                if elapsed_occ >= self.delay_on_ac_seconds:
                                    last_off = ac_state.get("last_turned_off")
                                    if last_off is not None:
                                        time_since_off = now - last_off
                                        if time_since_off < self.compressor_protection_seconds:
                                            logger.info(
                                                f"🛡️ [AC] Compressor protection active for room {room_id} "
                                                f"({time_since_off:.0f}s / {self.compressor_protection_seconds:.0f}s)"
                                            )
                                        else:
                                            self._turn_ac_on(room_id, ac_state, cur, conn)
                                    else:
                                        self._turn_ac_on(room_id, ac_state, cur, conn)

                        else:
                            ac_state["occupied_since"] = None

                            if ac_state["current_status"] == "ON":
                                if ac_state["empty_since"] is None:
                                    ac_state["empty_since"] = now

                                elapsed_empty = now - ac_state["empty_since"]
                                if elapsed_empty >= self.delay_off_seconds:
                                    self._turn_ac_off(room_id, ac_state, cur, conn, now)

            except Exception as e:
                logger.error(f"❌ Process inference error: {e}")
            finally:
                if conn:
                    from app.zona_loader import release_connection
                    release_connection(conn)

    def _turn_ac_on(self, room_id, ac_state, cur, conn):
        """Issue AC ON command and update internal + DB state."""
        cur.execute(
            "SELECT COALESCE(temperature_setting, 24) FROM ac_controls WHERE room_id = %s LIMIT 1",
            (room_id,)
        )
        temp_row = cur.fetchone()
        temperature = float(temp_row[0]) if temp_row else 24.0

        mqtt_commander.send_ac_command(
            room_id=room_id, command="ON",
            temperature=temperature, source="ai_decision"
        )
        ac_state["current_status"] = "ON"
        ac_state["occupied_since"] = None

        cur.execute(
            "UPDATE ac_controls SET ac_status = 'ON', updated_at = NOW() WHERE room_id = %s",
            (room_id,)
        )
        conn.commit()
        logger.info(f"❄️ AC ON - Room {room_id} (T={temperature}°C)")

    def _turn_ac_off(self, room_id, ac_state, cur, conn, now: float):
        """Issue AC OFF command, record last_turned_off for compressor protection, update DB."""
        mqtt_commander.send_ac_command(
            room_id=room_id, command="OFF",
            temperature=None, source="ai_decision"
        )
        ac_state["current_status"] = "OFF"
        ac_state["empty_since"] = None
        # [FIX #2] Record shutdown time so compressor protection kicks in on next ON request
        ac_state["last_turned_off"] = now

        cur.execute(
            "UPDATE ac_controls SET ac_status = 'OFF', updated_at = NOW() WHERE room_id = %s",
            (room_id,)
        )
        conn.commit()
        logger.info(f"🌡️ AC OFF - Room {room_id}")

    def sync_room_zone_statuses(self, room_id: str, status: str):
        """
        Thread-safe method to sync internal zone states when external triggers
        (e.g., ScheduleRunner or manual commands) change light status to ON or OFF.
        """
        with self._lock:
            synced = 0
            target_status = status.upper()
            for z_id, zone in self.zone_states.items():
                if zone.get("room_id") == room_id:
                    zone["current_status"] = target_status
                    zone["occupied_since"] = None
                    zone["empty_since"] = None
                    synced += 1
            logger.info(f"🔄 [DECISION ENGINE] Synced {synced} zone(s) to '{target_status}' for Room {room_id}")


# Singleton
decision_engine = DecisionEngine()