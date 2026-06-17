import os
import time
import logging
from datetime import datetime
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
        # State tracking per zone:
        # zone_id -> {
        #     "zone_id": int,
        #     "zone_name": str,
        #     "current_status": "ON" | "OFF",
        #     "occupied_since": float | None,
        #     "empty_since": float | None,
        #     "pending_on": bool,
        #     "pending_off": bool
        # }
        self.zone_states = {}
        # State tracking per room AC:
        # room_id -> {
        #     "room_id": int,
        #     "current_status": "ON" | "OFF",
        #     "occupied_since": float | None,
        #     "empty_since": float | None,
        #     "last_turned_off": float | None
        # }
        self.ac_states = {}

        self._camera_room_cache = {}
        self._initialized_cameras = set()
        self._unknown_camera_last_check = {}  # camera_id -> timestamp terakhir kali di-cek

        # Load delay configurations
        self.delay_on_light = float(os.getenv("DELAY_ON_LIGHT_SECONDS", 5))
        self.delay_on_ac = float(os.getenv("DELAY_ON_AC_MINUTES", 3)) * 60
        self.delay_off = float(os.getenv("DELAY_OFF_MINUTES", 5)) * 60
        self.compressor_protection_seconds = float(os.getenv("COMPRESSOR_PROTECTION_SECONDS", 180))

        logger.info(f"⚙️ Decision Engine Initialized with DELAY_ON_LIGHT={self.delay_on_light}s, DELAY_ON_AC={self.delay_on_ac}s, DELAY_OFF={self.delay_off}s, COMPRESSOR_PROTECTION={self.compressor_protection_seconds}s")

    def _initialize_camera_states(self, camera_id: str):
        """
        Initializes zone and AC states from the database for the given camera.
        """
        if camera_id in self._initialized_cameras:
            return

        last_check = self._unknown_camera_last_check.get(camera_id)
        if last_check is not None and (time.time() - last_check) < 60:
            return

        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                # 1. Fetch Room ID associated with Camera
                cur.execute("SELECT room_id FROM cameras WHERE camera_id = %s", (camera_id,))
                room_row = cur.fetchone()
                if not room_row:
                    logger.error(f"❌ Camera ID {camera_id} not found in DB")
                    self._unknown_camera_last_check[camera_id] = time.time()
                    return
                room_id = room_row[0]
                self._camera_room_cache[camera_id] = room_id

                # 2. Fetch Active Zones and their Light Control states
                cur.execute("""
                    SELECT z.zone_id, z.zone_name, COALESCE(lc.light_status, 'OFF')
                    FROM zones z
                    LEFT JOIN light_controls lc ON z.zone_id = lc.zone_id
                    WHERE z.room_id = %s AND z.zone_status = 'aktif'
                """, (room_id,))
                zone_rows = cur.fetchall()

                for row in zone_rows:
                    z_id, z_name, l_status = row
                    if z_id not in self.zone_states:
                        self.zone_states[z_id] = {
                            "zone_id": z_id,
                            "zone_name": z_name,
                            "room_id": room_id,
                            "current_status": l_status,
                            "occupied_since": None,
                            "empty_since": None,
                            "pending_on": False,
                            "pending_off": False
                        }
                        logger.info(f"🔹 Initialized Zone state: ID {z_id} ({z_name}) as {l_status}")

                # 3. Fetch AC Control state for the Room
                if room_id not in self.ac_states:
                    cur.execute("""
                        SELECT COALESCE(ac_status, 'OFF')
                        FROM ac_controls
                        WHERE room_id = %s
                        LIMIT 1
                    """, (room_id,))
                    ac_row = cur.fetchone()
                    ac_status = ac_row[0] if ac_row else "OFF"
                    
                    self.ac_states[room_id] = {
                        "room_id": room_id,
                        "current_status": ac_status,
                        "occupied_since": None,
                        "empty_since": None,
                        "last_turned_off": None
                    }
                    logger.info(f"🔹 Initialized AC state: Room {room_id} as {ac_status}")

                self._initialized_cameras.add(camera_id)

        except Exception as e:
            logger.error(f"❌ DB Error during state initialization for Camera {camera_id}: {e}")
        finally:
            if conn:
                from app.zona_loader import release_connection
                release_connection(conn)

    def process_inference(self, camera_id: str, occupancy_counts: dict):
        """
        Processes an inference cycle.
        occupancy_counts is a dictionary mapping zone_name -> count
        """
        with self._lock:
            # Ensure states are initialized
            self._initialize_camera_states(camera_id)

            room_id = self._camera_room_cache.get(camera_id)
            if not room_id:
                return

            # Filter zone states belonging to the current camera's room
            conn = None
            try:
                conn = get_db_connection()
                with conn.cursor() as cur:
                    # Filter zone states for this room
                    active_room_zones = [z for z in self.zone_states.values() if z["room_id"] == room_id]
                    now = time.time()

                    # Process each zone
                    for zone in active_room_zones:
                        z_id = zone["zone_id"]
                        z_name = zone["zone_name"]
                        count = occupancy_counts.get(z_name, 0)

                        if count > 0:
                            zone["empty_since"] = None
                            zone["pending_off"] = False

                            if zone["current_status"] == "OFF":
                                if zone["occupied_since"] is None:
                                    zone["occupied_since"] = now
                                    zone["pending_on"] = True

                                if (now - zone["occupied_since"]) >= self.delay_on_light:
                                    # Fetch relay channel
                                    cur.execute("""
                                        SELECT relay_channel FROM light_controls
                                        WHERE zone_id = %s LIMIT 1
                                    """, (z_id,))
                                    relay_row = cur.fetchone()
                                    relay_channel = relay_row[0] if relay_row else 1

                                    # Emit TURN ON
                                    mqtt_commander.send_light_command(
                                        room_id=room_id,
                                        relay_channel=relay_channel,
                                        command="ON",
                                        zone_id=z_id,
                                        zone_name=z_name,
                                        source="ai_decision"
                                    )
                                    zone["current_status"] = "ON"
                                    zone["occupied_since"] = None
                                    zone["pending_on"] = False

                                    # Update DB status
                                    cur.execute("""
                                        UPDATE light_controls
                                        SET light_status = 'ON', updated_at = NOW()
                                        WHERE zone_id = %s
                                    """, (z_id,))
                                    conn.commit()
                                    logger.info(f"🟢 Command TURN_ON sent & DB updated for Zone '{z_name}' (ID {z_id})")
                        else:
                            # Clear occupied tracker and pending on
                            zone["occupied_since"] = None
                            zone["pending_on"] = False

                            if zone["current_status"] == "ON":
                                if zone["empty_since"] is None:
                                    zone["empty_since"] = now
                                    zone["pending_off"] = True

                                # Check if delay has passed
                                if (now - zone["empty_since"]) >= self.delay_off:
                                    # Fetch relay channel
                                    cur.execute("""
                                        SELECT relay_channel FROM light_controls
                                        WHERE zone_id = %s LIMIT 1
                                    """, (z_id,))
                                    relay_row = cur.fetchone()
                                    relay_channel = relay_row[0] if relay_row else 1

                                    # Emit TURN OFF
                                    mqtt_commander.send_light_command(
                                        room_id=room_id,
                                        relay_channel=relay_channel,
                                        command="OFF",
                                        zone_id=z_id,
                                        zone_name=z_name,
                                        source="ai_decision"
                                    )
                                    zone["current_status"] = "OFF"
                                    zone["empty_since"] = None
                                    zone["pending_off"] = False

                                    # Update DB status
                                    cur.execute("""
                                        UPDATE light_controls
                                        SET light_status = 'OFF', updated_at = NOW()
                                        WHERE zone_id = %s
                                    """, (z_id,))
                                    conn.commit()
                                    logger.info(f"🔴 Command TURN_OFF sent & DB updated for Zone '{z_name}' (ID {z_id})")

                # Process Room AC
                # AC turns ON if ANY zone in the room is occupied (has occupancy > 0)
                # AC turns OFF only if ALL zones in the room are empty (occupancy = 0)
                room_occupied = any(occupancy_counts.get(z["zone_name"], 0) > 0 for z in active_room_zones)
                ac_state = self.ac_states.get(room_id)

                if ac_state:
                    if room_occupied:
                        ac_state["empty_since"] = None

                        if ac_state["current_status"] == "OFF":
                            if ac_state["occupied_since"] is None:
                                ac_state["occupied_since"] = now
                                logger.info(f"⏳ Room {room_id} AC pending ON (occupancy detected).")

                            if (now - ac_state["occupied_since"]) >= self.delay_on_ac:
                                last_off = ac_state.get("last_turned_off")
                                if last_off is not None and (now - last_off) < self.compressor_protection_seconds:
                                    remaining = self.compressor_protection_seconds - (now - last_off)
                                    logger.info(f"⏸️ AC Room {room_id}: compressor protection active, {remaining:.0f}s remaining.")
                                else:
                                    # Fetch AC settings
                                    cur.execute("""
                                        SELECT temperature_setting FROM ac_controls
                                        WHERE room_id = %s LIMIT 1
                                    """, (room_id,))
                                    ac_row = cur.fetchone()
                                    temp = ac_row[0] if ac_row else 22.0

                                    # Emit TURN ON
                                    mqtt_commander.send_ac_command(
                                        room_id=room_id,
                                        command="ON",
                                        temperature=temp,
                                        source="ai_decision"
                                    )
                                    ac_state["current_status"] = "ON"
                                    ac_state["occupied_since"] = None

                                    # Update DB status
                                    cur.execute("""
                                        UPDATE ac_controls
                                        SET ac_status = 'ON', updated_at = NOW()
                                        WHERE room_id = %s
                                    """, (room_id,))
                                    conn.commit()
                                    logger.info(f"🟢 AC turned ON for Room {room_id}")
                    else:
                        ac_state["occupied_since"] = None

                        if ac_state["current_status"] == "ON":
                            if ac_state["empty_since"] is None:
                                ac_state["empty_since"] = now
                                logger.info(f"⏳ Room {room_id} AC pending OFF (all zones empty).")

                            if (now - ac_state["empty_since"]) >= self.delay_off:
                                # Fetch AC settings
                                cur.execute("""
                                    SELECT temperature_setting FROM ac_controls
                                    WHERE room_id = %s LIMIT 1
                                """, (room_id,))
                                ac_row = cur.fetchone()
                                temp = ac_row[0] if ac_row else 22.0

                                # Emit TURN OFF
                                mqtt_commander.send_ac_command(
                                    room_id=room_id,
                                    command="OFF",
                                    temperature=temp,
                                    source="ai_decision"
                                )
                                ac_state["current_status"] = "OFF"
                                ac_state["empty_since"] = None
                                ac_state["last_turned_off"] = now

                                # Update DB status
                                cur.execute("""
                                    UPDATE ac_controls
                                    SET ac_status = 'OFF', updated_at = NOW()
                                    WHERE room_id = %s
                                """, (room_id,))
                                conn.commit()
                                logger.info(f"🔴 AC turned OFF for Room {room_id}")

            except Exception as e:
                logger.error(f"❌ DB Error during process_inference decision flow: {e}")
                if conn:
                    conn.rollback()
            finally:
                if conn:
                    from app.zona_loader import release_connection
                    release_connection(conn)

# Create a singleton instance of DecisionEngine
decision_engine = DecisionEngine()
