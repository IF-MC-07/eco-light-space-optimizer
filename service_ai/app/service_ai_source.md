# SERVICE_AI SOURCE CODE
Generated automatically.


====================================================================================================
FILE : __init__.py
====================================================================================================

```py

```


====================================================================================================
FILE : boot_recovery.py
====================================================================================================

```py
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

```


====================================================================================================
FILE : camera_loader.py
====================================================================================================

```py
import base64
import hashlib
import logging
import os
import psycopg2.extras

logger = logging.getLogger(__name__)

_CRYPTO_AVAILABLE = True
try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
except ImportError:
    _CRYPTO_AVAILABLE = False
    logger.warning("cryptography package not installed. Camera URL decryption from DB will be disabled.")

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection


def decrypt_camera_url(text: str) -> str:
    if not text:
        return text

    text = text.strip()
    parts = text.split(':')
    if len(parts) != 2 or len(parts[0]) != 32:
        return text

    if not _CRYPTO_AVAILABLE:
        logger.warning("cryptography unavailable, returning raw camera URL from DB.")
        return text

    try:
        iv = bytes.fromhex(parts[0])
        encrypted_text = bytes.fromhex(parts[1])
        secret = os.environ.get('CAMERA_SECRET_KEY', '')
        base64_key = base64.b64encode(hashlib.sha256(str(secret).encode()).digest()).decode()
        key = base64_key[:32].encode()

        cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        decrypted_padded = decryptor.update(encrypted_text) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()

        return decrypted.decode('utf-8').strip()
    except Exception as e:
        logger.error(f"❌ Error decrypting camera URL: {e}")
        return text


def get_camera_stream_source(camera_id: str) -> str | None:
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT ip_address, status FROM cameras WHERE camera_id = %s LIMIT 1",
                (camera_id,),
            )
            row = cur.fetchone()
            if not row:
                return None

            status = row.get('status')
            if status not in ('aktif', 'active'):
                return None

            ip_address = row.get('ip_address')
            result = decrypt_camera_url(ip_address) if ip_address else None
            return result.strip() if isinstance(result, str) else result
    except Exception as e:
        logger.error(f"❌ Failed to load camera stream source from DB: {e}")
        return None
    finally:
        if conn:
            release_connection(conn)


def get_active_camera_sources() -> list[dict]:
    conn = None
    cameras = []
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT camera_id, ip_address FROM cameras WHERE status IN ('aktif', 'active') AND ip_address IS NOT NULL AND ip_address <> ''",
            )
            rows = cur.fetchall()
            for row in rows:
                ip = decrypt_camera_url(row['ip_address']) if row['ip_address'] else None
                if isinstance(ip, str):
                    ip = ip.strip()
                cameras.append({
                    'camera_id': row['camera_id'],
                    'ip_address': ip,
                })
            logger.info(f"DEBUG camera data: {cameras}")
    except Exception as e:
        logger.error(f"❌ Failed to load active camera sources from DB: {e}")
    finally:
        if conn:
            release_connection(conn)
    return [cam for cam in cameras if cam['ip_address']]
```


====================================================================================================
FILE : db_healthcheck.py
====================================================================================================

```py
import time
import logging

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection

log = logging.getLogger(__name__)

def wait_for_db(max_retries=20, interval=3):
    """
    Try connecting to PostgreSQL every `interval` seconds.
    Raise RuntimeError if max_retries exceeded.
    Log each attempt.
    """
    for attempt in range(1, max_retries + 1):
        try:
            conn = get_db_connection()
            release_connection(conn)
            log.info(f"✅ PostgreSQL ready (attempt {attempt})")
            return True
        except Exception as e:
            log.warning(f"⏳ DB not ready (attempt {attempt}/{max_retries}): {e}")
            time.sleep(interval)
    raise RuntimeError("❌ PostgreSQL not available after max retries. Aborting.")

def wait_for_mqtt(host, port, max_retries=20, interval=3):
    """
    Try TCP socket connection to MQTT broker every `interval` seconds.
    Raise RuntimeError if max_retries exceeded.
    """
    import socket
    for attempt in range(1, max_retries + 1):
        try:
            sock = socket.create_connection((host, port), timeout=2)
            sock.close()
            log.info(f"✅ MQTT broker ready (attempt {attempt})")
            return True
        except Exception as e:
            log.warning(f"⏳ MQTT not ready (attempt {attempt}/{max_retries}): {e}")
            time.sleep(interval)
    raise RuntimeError("❌ MQTT broker not available after max retries. Aborting.")

```


====================================================================================================
FILE : db_state.py
====================================================================================================

```py
import logging

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

logger = logging.getLogger(__name__)

def ensure_device_states_exist():
    """
    Ensure light_controls and ac_controls always have a row 
    for every device. Prevents NULL state issues during recovery.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # For every iot_device of type 'light'
            logger.info("Ensuring light controls exist in DB...")
            cur.execute("""
                INSERT INTO light_controls (control_id, zone_id, device_id, relay_channel, light_status, updated_at)
                SELECT 'LGT' || substring(md5(d.device_id), 1, 15), z.zone_id, d.device_id, 1, 'OFF', NOW()
                FROM iot_devices d
                JOIN zones z ON d.room_id = z.room_id
                WHERE d.type = 'light'
                ON CONFLICT (control_id) DO NOTHING;
            """)
            
            # For every iot_device of type 'ac'
            logger.info("Ensuring AC controls exist in DB...")
            cur.execute("""
                INSERT INTO ac_controls (ac_control_id, room_id, device_id, temperature_setting, ac_status, updated_at)
                SELECT 'ACC' || substring(md5(d.device_id), 1, 15), d.room_id, d.device_id, 22.0, 'OFF', NOW()
                FROM iot_devices d
                WHERE d.type = 'ac'
                ON CONFLICT (ac_control_id) DO NOTHING;
            """)
            conn.commit()
            logger.info("✅ Device states successfully ensured in DB.")
    except Exception as e:
        logger.error(f"❌ Error ensuring device states exist: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)

```


====================================================================================================
FILE : decision_engine.py
====================================================================================================

```py
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

```


====================================================================================================
FILE : inference_realtime.py
====================================================================================================

```py
import cv2
import json
import logging
import os
import time
import threading
import requests

import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from ultralytics import YOLO

try:
    from app.zona_loader import ambil_zona_dari_db, titik_di_zona
    from app.camera_loader import get_camera_stream_source, get_active_camera_sources
except ImportError:
    from zona_loader import ambil_zona_dari_db, titik_di_zona
    from camera_loader import get_camera_stream_source, get_active_camera_sources

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────────
MQTT_BROKER        = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT          = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER          = os.getenv("MQTT_USER")
MQTT_PASSWORD      = os.getenv("MQTT_PASSWORD")
SNAPSHOT_INTERVAL  = float(os.getenv("SNAPSHOT_INTERVAL", 3))
ZONE_FETCH_INTERVAL= float(os.getenv("ZONE_FETCH_INTERVAL", 60))
CONF_THRESHOLD     = float(os.getenv("CONF_THRESHOLD", 0.25))
IOU_THRESHOLD      = float(os.getenv("IOU_THRESHOLD", 0.45))
MODEL_PATH         = os.getenv("MODEL_PATH", "yolov8n.pt")
API_URL            = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY  = os.getenv("CAMERA_SECRET_KEY")
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|thread_queue_size;512"


# ─── Shared Model + Lock ─────────────────────────────────────────────────────
_model = None
_model_lock = threading.Lock()

def get_model():
    global _model
    if _model is None:
        log.info(f"🔃 Loading YOLOv8 model from {MODEL_PATH}...")
        _model = YOLO(MODEL_PATH)
        log.info("✅ Model loaded.")
    return _model

# ─── MQTT Handler ─────────────────────────────────────────────────────────────
class MQTTHandler:
    def __init__(self):
        self.connected = False
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2
        )
        if MQTT_USER and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            self.connected = True
            log.info(f"✅ MQTT terhubung ke {MQTT_BROKER}:{MQTT_PORT}")
        else:
            self.connected = False
            log.error(f"❌ MQTT gagal connect, kode: {reason_code}")

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        self.connected = False
        log.warning(f"⚠️ MQTT terputus (kode: {reason_code}), mencoba reconnect...")

    def connect(self):
        self.client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        self.client.loop_start()

    def publish(self, topic: str, payload: dict) -> bool:
        if not self.connected:
            return False
        result = self.client.publish(topic, json.dumps(payload), qos=1)
        return result.rc == mqtt.MQTT_ERR_SUCCESS

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()

# ─── Fetch semua kamera aktif dari DB/API ─────────────────────────────────────
def get_active_cameras() -> list:
    cameras = get_active_camera_sources()
    if cameras:
        return cameras

    if not CAMERA_SECRET_KEY:
        log.error("❌ CAMERA_SECRET_KEY tidak diatur dalam environment variables!")
        return []

    try:
        headers = {"x-ai-secret": CAMERA_SECRET_KEY}
        response = requests.get(f"{API_URL}/cameras/ai/stream-urls", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return data.get("data", [])
            else:
                log.error(f"❌ API Error: {data.get('message')}")
        else:
            log.error(f"❌ API returned status {response.status_code}: {response.text}")
            
    except Exception as e:
        log.error(f"❌ Error fetching cameras from API: {e}")
        
    return []

# ─── Hitung per zona ──────────────────────────────────────────────────────────
def hitung_per_zona(boxes, zones: list, width: int, height: int) -> dict:
    count = {z["zone_name"]: 0 for z in zones}
    count["luar_zona"] = 0
    count["total"] = 0

    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx_rel = ((x1 + x2) / 2) / width
        cy_rel = ((y1 + y2) / 2) / height

        masuk_zona = False
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z["zone_name"]] += 1
                masuk_zona = True
                break

        if not masuk_zona:
            count["luar_zona"] += 1
        count["total"] += 1

    return count

def open_capture(cam_source, timeout_ms=5000):
    if isinstance(cam_source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(cam_source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(cam_source, cv2.CAP_FFMPEG)
        try:
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, timeout_ms)
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, timeout_ms)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))
        except Exception:
            pass
    return cap

# ─── Worker per kamera ────────────────────────────────────────────────────────
def camera_worker(camera_id: str, ip_address: str, mqtt_handler: MQTTHandler, stop_event: threading.Event):
    log.info(f"🎥 Starting worker for {camera_id} ({ip_address})")

    cam_source = int(ip_address) if ip_address.isdigit() else ip_address
    zones = []
    last_zone_fetch = 0.0
    prev_data = {}

    while not stop_event.is_set():
        now = time.time()

        # Refresh zona dari DB
        if (now - last_zone_fetch) >= ZONE_FETCH_INTERVAL or last_zone_fetch == 0.0:
            try:
                zones = ambil_zona_dari_db(camera_id)
                last_zone_fetch = now
                log.info(f"🔄 [{camera_id}] Reloaded {len(zones)} zona dari DB.")
            except Exception as e:
                log.error(f"❌ [{camera_id}] Gagal fetch zona: {e}")

        # Ambil snapshot
        try:
            cap = open_capture(cam_source)
            if not cap.isOpened():
                log.warning(f"⚠️ [{camera_id}] Kamera tidak bisa dibuka, retry dalam {SNAPSHOT_INTERVAL}s")
                time.sleep(SNAPSHOT_INTERVAL)
                continue

            for _ in range(5):
                cap.read()

            ret, frame = cap.read()
            cap.release()

            if not ret:
                log.warning(f"⚠️ [{camera_id}] Frame tidak terbaca, skip.")
                time.sleep(SNAPSHOT_INTERVAL)
                continue

        except Exception as e:
            log.error(f"❌ [{camera_id}] Error capture: {e}")
            try:
                cap.release()
            except:
                pass
            time.sleep(SNAPSHOT_INTERVAL)
            continue
        # Inference dengan lock
        try:
            with _model_lock:
                model = get_model()
                results = model.predict(
                    frame,
                    conf=CONF_THRESHOLD,
                    iou=IOU_THRESHOLD,
                    classes=[0],
                    verbose=False,
                    save=False,
                    save_txt=False,
                )
        except Exception as e:
            log.error(f"❌ [{camera_id}] Inference error: {e}")
            time.sleep(SNAPSHOT_INTERVAL)
            continue

        height, width = frame.shape[:2]
        count = hitung_per_zona(results[0].boxes, zones, width, height)
        status = "ON" if count["total"] > 0 else "OFF"

        try:
            from app.decision_engine import decision_engine
            decision_engine.process_inference(camera_id, count)
        except Exception as e:
            log.error(f"❌ [{camera_id}] Decision error: {e}")

        if count != prev_data:
            topic = f"ai/inference/result/{camera_id}"
            payload = {**count, "lampu": status, "camera_id": camera_id}
            if mqtt_handler.publish(topic, payload):
                log.info(f"📤 [{camera_id}] {payload}")

            try:
                from app.log_writer import write_detection_logs
                write_detection_logs(camera_id, count)
            except Exception as e:
                log.error(f"❌ [{camera_id}] Log error: {e}")

            prev_data = count.copy()

        time.sleep(SNAPSHOT_INTERVAL)

    log.info(f"🛑 [{camera_id}] Worker stopped.")

# ─── Entry point ──────────────────────────────────────────────────────────────
def run():
    mqtt_handler = MQTTHandler()
    mqtt_handler.connect()

    cameras = get_active_cameras()
    if not cameras:
        log.error("❌ Tidak ada kamera aktif di DB. Service berhenti.")
        mqtt_handler.stop()
        return

    log.info(f"📷 {len(cameras)} kamera aktif ditemukan: {[c['camera_id'] for c in cameras]}")

    stop_event = threading.Event()
    threads = []

    for cam in cameras:
        t = threading.Thread(
            target=camera_worker,
            args=(cam["camera_id"], cam["ip_address"], mqtt_handler, stop_event),
            daemon=True,
            name=f"worker-{cam['camera_id']}"
        )
        t.start()
        threads.append(t)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log.info("\n🛑 Dihentikan oleh user.")
        stop_event.set()

    for t in threads:
        t.join(timeout=5)

    mqtt_handler.stop()
    log.info("✅ Semua worker berhenti, service selesai.")

if __name__ == "__main__":
    run()
```


====================================================================================================
FILE : log_writer.py
====================================================================================================

```py
import logging
import uuid
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

load_dotenv()
logger = logging.getLogger(__name__)

def write_detection_logs(camera_id: str, occupancy_counts: dict):
    """
    Saves occupancy count per zone to detection_logs table using batch INSERT.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # 1. Fetch active zones for this camera's room to map names to zone_ids
            cur.execute("""
                SELECT zone_id, zone_name 
                FROM zones 
                WHERE room_id = (
                    SELECT room_id FROM cameras WHERE camera_id = %s
                )
                AND zone_status = 'aktif'
            """, (camera_id,))
            
            zone_rows = cur.fetchall()
            if not zone_rows:
                logger.warning(f"⚠️ No active zones found for camera_id {camera_id} while writing logs.")
                return

            # Map zone_name -> zone_id
            zone_mapping = {row[1]: row[0] for row in zone_rows}

            # 2. Build tuples list for batch insert
            insert_tuples = []
            for zone_name, count in occupancy_counts.items():
                # Skip helper keys that might be in occupancy_counts
                if zone_name in ["total", "luar_zona"]:
                    continue

                zone_id = zone_mapping.get(zone_name)
                if zone_id is None:
                    # If zone name is not mapped (e.g. newly added/modified zone not in cache)
                    # We skip it or log it
                    continue

                status = 'occupied' if count > 0 else 'empty'
                detection_id = f"DET-{uuid.uuid4().hex[:8]}"
                insert_tuples.append((
                    detection_id,
                    camera_id,
                    zone_id,
                    count,
                    status
                ))

            # 3. Perform batch insert using psycopg2.extras.execute_values
            if insert_tuples:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO detection_logs 
                      (detection_id, camera_id, zone_id, occupancy_count, zone_status, detection_time)
                    VALUES %s
                    """,
                    insert_tuples,
                    template="(%s, %s, %s, %s, %s, NOW())"
                )
                conn.commit()
                logger.info(f"📝 Batch inserted {len(insert_tuples)} detection logs for Camera {camera_id}.")

    except Exception as e:
        logger.error(f"❌ DB Error writing detection logs: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)

```


====================================================================================================
FILE : models\energy.py
====================================================================================================

```py
from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from app.db import Base

class EnergyReading(Base):
    __tablename__ = "energy_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True, nullable=False)
    voltage = Column(Float)
    current = Column(Float)
    power = Column(Float)
    energy = Column(Float)
    frequency = Column(Float)
    power_factor = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
```


====================================================================================================
FILE : mqtt_commands.py
====================================================================================================

```py
import json
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

### Import dependencies
try:
    from app.mqtt_subscriber import mqtt_client
    from app.zona_loader import get_db_connection
except ImportError:
    from mqtt_subscriber import mqtt_client
    from zona_loader import get_db_connection

load_dotenv()
logger = logging.getLogger(__name__)

class MQTTCommander:
    def send_light_command(self, room_id: str, relay_channel: int, command: str, zone_id: int, zone_name: str, source: str = "ai_decision"):
        """

        Sends light control command to ESP32 via MQTT.
        Topic: devices/{room_id}/light/{relay_channel}
        """
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
            mqtt_client.publish(topic, json.dumps(payload))
            logger.info(f"💡 Light command published to {topic}: {payload}")
        except Exception as e:
            logger.error(f"❌ Failed to publish light command: {e}")

    def send_ac_command(self, room_id: str, command: str, temperature: float, source: str = "ai_decision"):
        """
        Sends AC control command to ESP32 via MQTT.
        Topic: devices/{room_id}/ac
        """
        topic = f"devices/{room_id}/ac"
        payload = {
            "command": command,
            "room_id": room_id,
            "temperature": float(temperature),
            "source": source,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        try:
            mqtt_client.publish(topic, json.dumps(payload))
            logger.info(f"❄️ AC command published to {topic}: {payload}")
        except Exception as e:
            logger.error(f"❌ Failed to publish AC command: {e}")

    def request_status(self, room_id: str):
        """
        Sends a request to ESP32 to get current status.
        Topic: devices/{room_id}/status/request
        """
        topic = f"devices/{room_id}/status/request"
        payload = {
            "room_id": room_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        try:
            mqtt_client.publish(topic, json.dumps(payload))
            logger.info(f"❓ Requested device status on topic {topic}")
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

```


====================================================================================================
FILE : mqtt_subscriber.py
====================================================================================================

```py
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
            client.subscribe("devices/+/energy")          # ← Tambahan untuk PZEM
            logger.info("📡 Subscribed to devices/+/energy topic")
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
        elif topic.startswith("devices/") and topic.endswith("/energy"):   # ← Tambahan
            self._handle_pzem_energy(topic, payload)
        else:
            logger.debug(f"Unhandled topic: {topic}")

    # ==================== TAMBAHAN HANDLER PZEM ====================
    def _handle_pzem_energy(self, topic: str, payload: dict):
        """Handle data PZEM dari ESP32"""
        try:
            room_id = payload.get("room_id")
            if not room_id:
                logger.warning("PZEM payload tanpa room_id")
                return

            from app.models.energy import EnergyReading
            from app.db import SessionLocal
            from datetime import datetime

            db = SessionLocal()
            
            reading = EnergyReading(
                room_id=room_id,
                voltage=float(payload.get("voltage", 0.0)),
                current=float(payload.get("current", 0.0)),
                power=float(payload.get("power", 0.0)),
                energy=float(payload.get("energy", 0.0)),
                frequency=float(payload.get("frequency", 0.0)),
                power_factor=float(payload.get("pf", 0.0)),
                timestamp=datetime.utcnow()
            )
            
            db.add(reading)
            db.commit()
            
            logger.info(f"💾 [PZEM] Data tersimpan → Room {room_id} | Power: {payload.get('power')}W | Current: {payload.get('current')}A")
            
        except ImportError:
            logger.error("❌ Model EnergyReading belum dibuat. Buat dulu file app/models/energy.py")
        except Exception as e:
            logger.error(f"❌ Gagal menyimpan data PZEM: {e}")
        finally:
            if 'db' in locals():
                db.close()
    # ============================================================

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

def _handle_energy_data(self, topic: str, payload):
    """
    Handle data energi dari ESP32 (PZEM-004T).
    Topic: devices/{room_id}/energy
    Payload: {"room_id":"ROM-xxx","voltage":211.5,"current":0.07,
               "power":14.5,"energy":2.0,"frequency":50.1,"pf":0.95,"timestamp":"..."}
    Simpan ke tabel power_sensors (real-time) dan energy_logs (agregat harian).
    """
    try:
        from app.zona_loader import get_db_connection, release_connection
        import datetime

        # Ekstrak room_id dari topic: devices/ROM-1464452b/energy
        parts = topic.split('/')
        room_id = parts[1] if len(parts) >= 3 else payload.get('room_id', 'UNKNOWN')

        voltage    = float(payload.get('voltage', 0))
        current    = float(payload.get('current', 0))
        power      = float(payload.get('power', 0))
        energy     = float(payload.get('energy', 0))
        frequency  = float(payload.get('frequency', 0))
        pf         = float(payload.get('pf', 0))

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # 1. Simpan ke power_sensors (data real-time mentah)
                cur.execute("""
                    INSERT INTO power_sensors
                        (room_id, voltage_v, current_a, power_watts,
                         energy_kwh, frequency_hz, pf, read_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                """, (room_id, voltage, current, power, energy, frequency, pf))

                # 2. Upsert ke energy_logs (agregat per hari)
                today = datetime.date.today()
                cur.execute("""
                    INSERT INTO energy_logs
                        (room_id, date, voltage, current, power, energy,
                         frequency, pf, total_watts, saved_watts, recorded_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, NOW())
                    ON CONFLICT (room_id, date)
                    DO UPDATE SET
                        voltage    = EXCLUDED.voltage,
                        current    = EXCLUDED.current,
                        power      = EXCLUDED.power,
                        energy     = EXCLUDED.energy,
                        frequency  = EXCLUDED.frequency,
                        pf         = EXCLUDED.pf,
                        total_watts = energy_logs.total_watts + EXCLUDED.power,
                        recorded_at = NOW()
                """, (room_id, today, voltage, current, power, energy, frequency, pf, power))

            conn.commit()
            logger.info(
                f"✅ [ENERGY] Room {room_id} | "
                f"V={voltage}V I={current}A P={power}W E={energy}kWh"
            )
        finally:
            release_connection(conn)

    except Exception as e:
        logger.error(f"❌ [ENERGY] Gagal menyimpan data energi: {e}")
```


====================================================================================================
FILE : results.py
====================================================================================================

```py
import json
import logging
from app.mqtt_subscriber import mqtt_client

logger = logging.getLogger(__name__)

def publish_inference_result(results: list, camera_id: str = "cam_01"):
    """Publish hasil deteksi YOLOv8 ke MQTT"""
    payload = {
        "camera_id": camera_id,
        "detections": results,
        "count": len(results)
    }
    MQTT_TOPIC_RESULT = os.getenv("MQTT_TOPIC_RESULT", "ai/inference/result")
    mqtt_client.publish(MQTT_TOPIC_RESULT, payload)
    logger.info(f"✅ Result published: {len(results)} detections")

```


====================================================================================================
FILE : schedule_runner.py
====================================================================================================

```py
import os
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

```


====================================================================================================
FILE : snapshot.py
====================================================================================================

```py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import os
import io
import asyncio
import time
from ultralytics import YOLO
from app.zona_loader import ambil_zona_dari_db, titik_di_zona
from app.camera_loader import get_camera_stream_source

app = FastAPI()
MODEL_PATH = os.getenv('MODEL_PATH', 'yolov8n.pt')
model = YOLO(MODEL_PATH)

import requests

API_URL = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY = os.getenv("CAMERA_SECRET_KEY")

def get_kamera_ip(camera_id: str) -> str:
    source = get_camera_stream_source(camera_id)
    if source:
        return source

    if not CAMERA_SECRET_KEY:
        print("❌ CAMERA_SECRET_KEY tidak diatur!")
        return None

    try:
        headers = {"x-ai-secret": CAMERA_SECRET_KEY}
        response = requests.get(f"{API_URL}/cameras/ai/stream-urls", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                cameras = data.get("data", [])
                for cam in cameras:
                    if cam["camera_id"] == camera_id:
                        return cam["ip_address"]
    except Exception as e:
        print(f"API Error fetching camera IP: {e}")
    return None

def open_capture(cam_source, timeout_ms=5000):
    if isinstance(cam_source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(cam_source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(cam_source, cv2.CAP_FFMPEG)
        try:
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, timeout_ms)
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, timeout_ms)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))
        except Exception:
            pass
    return cap

async def read_frame_async(cap, timeout_secs=5.0):
    try:
        return await asyncio.wait_for(asyncio.to_thread(cap.read), timeout=timeout_secs)
    except asyncio.TimeoutError:
        return False, None

def process_frame(frame, id_kamera, zones):
    height, width = frame.shape[:2]
    results = model.predict(frame, conf=0.20, classes=[0], verbose=False)
    annotated = results[0].plot()

    count = {z['zone_name']: 0 for z in zones}
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx_rel = ((x1 + x2) // 2) / width
        cy_rel = ((y1 + y2) // 2) / height
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z['zone_name']] += 1
                break

    for z in zones:
        zx1, zy1 = int(z['x1_pct'] * width), int(z['y1_pct'] * height)
        zx2, zy2 = int(z['x2_pct'] * width), int(z['y2_pct'] * height)
        hex_color = z['color'].lstrip('#')
        try:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            color = (b, g, r)
        except:
            color = (0, 255, 0)
        cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), color, 2)
        cv2.putText(annotated, f"{z['zone_name']} | Orang: {count[z['zone_name']]}", 
                    (zx1, zy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return annotated

# ... (semua fungsi frame_generator, preview_generator, get_snapshot, take_snapshot tetap sama seperti sebelumnya)

# ==================== ENDPOINT PZEM ====================
@app.get("/energy/{room_id}/latest")
async def get_latest_energy(room_id: str):
    try:
        # Import dengan try-except supaya tidak crash
        try:
            from app.models.energy import EnergyReading
        except ImportError:
            return {"success": False, "error": "Model EnergyReading belum dibuat"}

        # Coba beberapa cara import SessionLocal
        try:
            from app.db import SessionLocal
        except ImportError:
            try:
                from db import SessionLocal
            except ImportError:
                return {"success": False, "error": "Tidak menemukan modul database"}

        db = SessionLocal()
        latest = db.query(EnergyReading)\
                   .filter(EnergyReading.room_id == room_id)\
                   .order_by(EnergyReading.timestamp.desc())\
                   .first()
        db.close()
        
        if latest:
            return {
                "success": True,
                "room_id": room_id,
                "power": latest.power,
                "voltage": latest.voltage,
                "current": latest.current,
                "energy": latest.energy,
                "pf": latest.power_factor,
                "timestamp": latest.timestamp.isoformat() if latest.timestamp else None
            }
        return {"success": False, "message": "Belum ada data PZEM untuk room ini"}
    except Exception as e:
        return {"success": False, "error": str(e)}
# ========================================================
# Fallback take_snapshot function
def take_snapshot():
    print("📸 take_snapshot trigger invoked!")
```


====================================================================================================
FILE : statistics_engine.py
====================================================================================================

```py
import os
import logging
from datetime import datetime
import numpy as np
import pandas as pd
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

load_dotenv()
logger = logging.getLogger(__name__)

# --- 5C. Carbon & Cost Estimation configuration ---
PLN_EMISSION_FACTOR = float(os.getenv("PLN_EMISSION_FACTOR", 0.00072))
PLN_TARIFF_IDR_PER_WH = float(os.getenv("PLN_TARIFF_IDR_PER_WH", 0.00138))


def calculate_carbon_savings(saved_watts: float) -> dict:
    """
    Convert saved_watts to:
    - co2_kg_saved: saved_watts * PLN_EMISSION_FACTOR
    - cost_idr_saved: saved_watts * PLN_TARIFF_IDR_PER_WH
    """
    co2_saved = saved_watts * PLN_EMISSION_FACTOR
    cost_saved = saved_watts * PLN_TARIFF_IDR_PER_WH
    return {
        "co2_kg_saved": float(np.round(co2_saved, 4)),
        "cost_idr_saved": float(np.round(cost_saved, 2))
    }


# --- 5A. Power Sensor Statistics ---
def get_realtime_stats(room_id=None) -> dict:
    """
    Returns descriptive stats from power_sensors:
    - mean_watts, median_watts, std_watts
    - min_watts, max_watts
    - mean_voltage, mean_current
    - latest_reading (most recent row)
    - sample_count
    Optional: filter by room_id
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = "SELECT power_watts, voltage_v, current_a, read_at FROM power_sensors"
            params = []
            if room_id is not None:
                query += " WHERE room_id = %s"
                params.append(room_id)
            query += " ORDER BY read_at DESC"
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        # Load into Pandas DataFrame
        df = pd.DataFrame(rows, columns=['power_watts', 'voltage_v', 'current_a', 'read_at'])
        
        if df.empty:
            return {
                "mean_watts": 0.0,
                "median_watts": 0.0,
                "std_watts": 0.0,
                "min_watts": 0.0,
                "max_watts": 0.0,
                "mean_voltage": 0.0,
                "mean_current": 0.0,
                "latest_reading": None,
                "sample_count": 0
            }

        # Cast column types
        df['power_watts'] = df['power_watts'].astype(float)
        df['voltage_v'] = df['voltage_v'].astype(float)
        df['current_a'] = df['current_a'].astype(float)

        mean_watts = float(df['power_watts'].mean())
        median_watts = float(df['power_watts'].median())
        # std is nan if sample size is 1
        std_watts = float(df['power_watts'].std()) if len(df) > 1 else 0.0
        if np.isnan(std_watts):
            std_watts = 0.0
            
        min_watts = float(df['power_watts'].min())
        max_watts = float(df['power_watts'].max())
        mean_voltage = float(df['voltage_v'].mean())
        mean_current = float(df['current_a'].mean())

        latest = df.iloc[0]
        latest_reading = {
            "power_watts": float(latest["power_watts"]),
            "voltage_v": float(latest["voltage_v"]),
            "current_a": float(latest["current_a"]),
            "read_at": latest["read_at"].isoformat() if hasattr(latest["read_at"], "isoformat") else str(latest["read_at"])
        }

        return {
            "mean_watts": float(np.round(mean_watts, 2)),
            "median_watts": float(np.round(median_watts, 2)),
            "std_watts": float(np.round(std_watts, 2)),
            "min_watts": float(np.round(min_watts, 2)),
            "max_watts": float(np.round(max_watts, 2)),
            "mean_voltage": float(np.round(mean_voltage, 2)),
            "mean_current": float(np.round(mean_current, 2)),
            "latest_reading": latest_reading,
            "sample_count": int(len(df))
        }
    except Exception as e:
        logger.error(f"❌ Error in get_realtime_stats: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_top_consumers(limit=5) -> list:
    """
    Returns rooms ranked by average power_watts DESC
    Each: { room_id, room_name, avg_watts, latest_watts }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ps.room_id, r.room_name, ps.power_watts, ps.read_at
                FROM power_sensors ps
                JOIN rooms r ON ps.room_id = r.room_id
            """)
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'power_watts', 'read_at'])
        if df.empty:
            return []

        df['power_watts'] = df['power_watts'].astype(float)
        
        # Calculate avg
        avg_df = df.groupby(['room_id', 'room_name'])['power_watts'].mean().reset_index(name='avg_watts')

        # Find latest
        df_sorted = df.sort_values(by='read_at', ascending=False)
        latest_df = df_sorted.groupby('room_id').first().reset_index()

        # Merge
        merged = avg_df.merge(latest_df[['room_id', 'power_watts']], on='room_id')
        merged = merged.rename(columns={'power_watts': 'latest_watts'})

        # Sort and limit
        merged = merged.sort_values(by='avg_watts', ascending=False).head(limit)

        result = []
        for _, row in merged.iterrows():
            result.append({
                "room_id": int(row['room_id']),
                "room_name": str(row['room_name']),
                "avg_watts": float(np.round(row['avg_watts'], 2)),
                "latest_watts": float(np.round(row['latest_watts'], 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_top_consumers: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def detect_usage_alerts(threshold_watts=500) -> list:
    """
    Returns rooms where latest power_watts > threshold_watts
    Each: { room_id, room_name, current_watts, threshold, exceeded_by }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ps.room_id, r.room_name, ps.power_watts, ps.read_at
                FROM power_sensors ps
                JOIN rooms r ON ps.room_id = r.room_id
            """)
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'power_watts', 'read_at'])
        if df.empty:
            return []

        df['power_watts'] = df['power_watts'].astype(float)

        # Get latest reading per room
        df_sorted = df.sort_values(by='read_at', ascending=False)
        latest_df = df_sorted.groupby(['room_id', 'room_name']).first().reset_index()

        alerts = latest_df[latest_df['power_watts'] > threshold_watts].copy()
        
        result = []
        for _, row in alerts.iterrows():
            current_watts = float(row['power_watts'])
            exceeded_by = current_watts - float(threshold_watts)
            result.append({
                "room_id": int(row['room_id']),
                "room_name": str(row['room_name']),
                "current_watts": float(np.round(current_watts, 2)),
                "threshold": float(threshold_watts),
                "exceeded_by": float(np.round(exceeded_by, 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in detect_usage_alerts: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


# --- 5B. Energy Log Statistics ---
def get_energy_summary(room_id=None) -> dict:
    """
    Returns from energy_logs:
    - total_consumption_watts (sum of total_watts)
    - total_saved_watts (sum of saved_watts)
    - savings_percentage = (saved / total) * 100
    - avg_daily_watts
    - peak_day { date, total_watts }
    - lowest_day { date, total_watts }
    - trend: 'improving' | 'stable' | 'worsening'
      (compare last 7 days avg vs previous 7 days avg)
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = "SELECT date, total_watts, saved_watts FROM energy_logs"
            params = []
            if room_id is not None:
                query += " WHERE room_id = %s"
                params.append(room_id)
            query += " ORDER BY date ASC"
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return {
                "total_consumption_watts": 0.0,
                "total_saved_watts": 0.0,
                "savings_percentage": 0.0,
                "avg_daily_watts": 0.0,
                "peak_day": None,
                "lowest_day": None,
                "trend": "stable"
            }

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        # Aggregate by date
        daily_df = df.groupby('date').agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        total_consumption = float(daily_df['total_watts'].sum())
        total_saved = float(daily_df['saved_watts'].sum())
        savings_pct = (total_saved / total_consumption * 100) if total_consumption > 0 else 0.0
        avg_daily = float(daily_df['total_watts'].mean())

        # Peak day
        peak_idx = daily_df['total_watts'].idxmax()
        peak_row = daily_df.loc[peak_idx]
        peak_day = {
            "date": peak_row['date'].isoformat() if hasattr(peak_row['date'], 'isoformat') else str(peak_row['date']),
            "total_watts": float(np.round(peak_row['total_watts'], 2))
        }

        # Lowest day
        lowest_idx = daily_df['total_watts'].idxmin()
        lowest_row = daily_df.loc[lowest_idx]
        lowest_day = {
            "date": lowest_row['date'].isoformat() if hasattr(lowest_row['date'], 'isoformat') else str(lowest_row['date']),
            "total_watts": float(np.round(lowest_row['total_watts'], 2))
        }

        # Trend analysis
        trend = 'stable'
        if len(daily_df) >= 2:
            n = min(7, len(daily_df) // 2)
            if n > 0:
                last_n_avg = daily_df.tail(n)['total_watts'].mean()
                prev_n_avg = daily_df.iloc[-2*n:-n]['total_watts'].mean()
                
                diff_pct = ((last_n_avg - prev_n_avg) / prev_n_avg) if prev_n_avg > 0 else 0.0
                if diff_pct < -0.05:  # consumption decreased by > 5%
                    trend = 'improving'
                elif diff_pct > 0.05:  # consumption increased by > 5%
                    trend = 'worsening'
                else:
                    trend = 'stable'

        return {
            "total_consumption_watts": float(np.round(total_consumption, 2)),
            "total_saved_watts": float(np.round(total_saved, 2)),
            "savings_percentage": float(np.round(savings_pct, 2)),
            "avg_daily_watts": float(np.round(avg_daily, 2)),
            "peak_day": peak_day,
            "lowest_day": lowest_day,
            "trend": trend
        }
    except Exception as e:
        logger.error(f"❌ Error in get_energy_summary: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_savings_breakdown(room_id=None) -> list:
    """
    Returns per-room savings breakdown:
    Each: { room_id, room_name, total_watts, saved_watts, savings_pct, rank }
    Sorted by saved_watts DESC
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = """
                SELECT el.room_id, r.room_name, el.total_watts, el.saved_watts
                FROM energy_logs el
                JOIN rooms r ON el.room_id = r.room_id
            """
            params = []
            if room_id is not None:
                query += " WHERE el.room_id = %s"
                params.append(room_id)
                
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'total_watts', 'saved_watts'])
        if df.empty:
            return []

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        breakdown = df.groupby(['room_id', 'room_name']).agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        breakdown['savings_pct'] = (breakdown['saved_watts'] / breakdown['total_watts'] * 100).fillna(0.0)
        breakdown = breakdown.sort_values(by='saved_watts', ascending=False)

        result = []
        for i, row in enumerate(breakdown.iterrows(), start=1):
            r_data = row[1]
            result.append({
                "room_id": int(r_data['room_id']),
                "room_name": str(r_data['room_name']),
                "total_watts": float(np.round(r_data['total_watts'], 2)),
                "saved_watts": float(np.round(r_data['saved_watts'], 2)),
                "savings_pct": float(np.round(r_data['savings_pct'], 2)),
                "rank": i
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_savings_breakdown: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_savings_trend(days=7) -> list:
    """
    Returns daily savings for last N days:
    Each: { date, total_watts, saved_watts, savings_pct }
    Sorted by date ASC
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT date, total_watts, saved_watts FROM energy_logs")
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return []

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        # Aggregate by date
        daily = df.groupby('date').agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        # Sort and take last N days
        daily = daily.sort_values(by='date', ascending=True).tail(days)
        daily['savings_pct'] = (daily['saved_watts'] / daily['total_watts'] * 100).fillna(0.0)

        result = []
        for _, row in daily.iterrows():
            result.append({
                "date": row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                "total_watts": float(np.round(row['total_watts'], 2)),
                "saved_watts": float(np.round(row['saved_watts'], 2)),
                "savings_pct": float(np.round(row['savings_pct'], 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_savings_trend: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_yoy_comparison() -> dict:
    """
    Year-over-Year comparison:
    - current_year_total_watts
    - previous_year_total_watts  
    - yoy_change_pct
    - current_year_saved_watts
    - previous_year_saved_watts
    - yoy_savings_change_pct
    Monthly breakdown: list of { month, current_year_watts, previous_year_watts }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT date, total_watts, saved_watts FROM energy_logs")
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return {
                "current_year_total_watts": 0.0,
                "previous_year_total_watts": 0.0,
                "yoy_change_pct": 0.0,
                "current_year_saved_watts": 0.0,
                "previous_year_saved_watts": 0.0,
                "yoy_savings_change_pct": 0.0,
                "monthly_breakdown": []
            }

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)
        
        # Parse date and extract year/month
        df['date'] = pd.to_datetime(df['date'])
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month

        current_year = datetime.now().year
        prev_year = current_year - 1

        cy_df = df[df['year'] == current_year]
        py_df = df[df['year'] == prev_year]

        cy_total = float(cy_df['total_watts'].sum())
        py_total = float(py_df['total_watts'].sum())

        cy_saved = float(cy_df['saved_watts'].sum())
        py_saved = float(py_df['saved_watts'].sum())

        yoy_change_pct = ((cy_total - py_total) / py_total * 100) if py_total > 0 else 0.0
        yoy_savings_change_pct = ((cy_saved - py_saved) / py_saved * 100) if py_saved > 0 else 0.0

        # Monthly breakdown
        # Group by month and year
        monthly_grouped = df[df['year'].isin([current_year, prev_year])].groupby(['month', 'year'])['total_watts'].sum().unstack(fill_value=0.0).reset_index()

        # Ensure both columns exist in dataframe index/columns
        if current_year not in monthly_grouped.columns:
            monthly_grouped[current_year] = 0.0
        if prev_year not in monthly_grouped.columns:
            monthly_grouped[prev_year] = 0.0

        month_names = {
            1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
        }

        monthly_breakdown = []
        for _, row in monthly_grouped.iterrows():
            m_num = int(row['month'])
            monthly_breakdown.append({
                "month": month_names.get(m_num, str(m_num)),
                "current_year_watts": float(np.round(row[current_year], 2)),
                "previous_year_watts": float(np.round(row[prev_year], 2))
            })

        return {
            "current_year_total_watts": float(np.round(cy_total, 2)),
            "previous_year_total_watts": float(np.round(py_total, 2)),
            "yoy_change_pct": float(np.round(yoy_change_pct, 2)),
            "current_year_saved_watts": float(np.round(cy_saved, 2)),
            "previous_year_saved_watts": float(np.round(py_saved, 2)),
            "yoy_savings_change_pct": float(np.round(yoy_savings_change_pct, 2)),
            "monthly_breakdown": monthly_breakdown
        }
    except Exception as e:
        logger.error(f"❌ Error in get_yoy_comparison: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)

```


====================================================================================================
FILE : test_camera.py
====================================================================================================

```py
import cv2
import paho.mqtt.client as mqtt
import json
import time
import os
from dotenv import load_dotenv
from ultralytics import YOLO

load_dotenv()

MODEL_PATH = os.getenv('yolov8n.pt')
model = YOLO('yolov8n.pt')

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC_RESULT = os.getenv("MQTT_TOPIC_RESULT", "ai/inference/result")

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.connect(MQTT_BROKER, MQTT_PORT)
client.loop_start()

cap = cv2.VideoCapture(1)
print("✅ Kamera aktif! Tekan 'q' untuk keluar")

prev_data = {}
last_send_time = 0
SEND_INTERVAL = 2

while True:
    ret, frame = cap.read()
    if not ret:
        break

    height, width = frame.shape[:2]

    # ── Bagi frame jadi 3 zona VERTIKAL ──────
    zona1 = width // 3       # batas kiri-tengah
    zona2 = 2 * width // 3   # batas tengah-kanan

    results = model.predict(
        frame,
        conf=0.25,
        iou=0.45,
        classes=[0],
        show_labels=False,
        show_conf=False,
        verbose=False
    )

    annotated = results[0].plot()

    # Hitung orang per zona
    count = {'kiri': 0, 'tengah': 0, 'kanan': 0, 'total': 0}

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2  # SEKARANG PAKAI TITIK TENGAH HORIZONTAL (X)

        if cx < zona1:
            count['kiri'] += 1
        elif cx < zona2:
            count['tengah'] += 1
        else:
            count['kanan'] += 1

        count['total'] += 1

    # ── Gambar garis zona vertikal ────────────
    cv2.line(annotated, (zona1, 0), (zona1, height), (255, 255, 0), 2)
    cv2.line(annotated, (zona2, 0), (zona2, height), (255, 255, 0), 2)

    # ── Label nama zona di garis ────────────────
    cv2.putText(annotated, "ZONA KIRI",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    cv2.putText(annotated, "ZONA TENGAH",
                (zona1 + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    cv2.putText(annotated, "ZONA KANAN",
                (zona2 + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # ── Info jumlah orang (Overlay Statis) ──────
    cv2.putText(annotated, f"Kiri   : {count['kiri']}",
                (10, height - 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(annotated, f"Tengah : {count['tengah']}",
                (10, height - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(annotated, f"Kanan  : {count['kanan']}",
                (10, height - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(annotated, f"Total  : {count['total']}",
                (10, height - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Status lampu
    status = 'ON' if count['total'] > 0 else 'OFF'
    
    # ── Kirim MQTT setiap 2 detik ───────────────
    current_time = time.time()
    if count != prev_data and (current_time - last_send_time) > SEND_INTERVAL:
        payload = json.dumps({
            'zona_kiri': count['kiri'],
            'zona_tengah': count['tengah'],
            'zona_kanan': count['kanan'],
            'total': count['total'],
            'lampu': status
        })
        client.publish(MQTT_TOPIC_RESULT, payload)
        print(f"📤 {payload}")
        prev_data = count.copy()
        last_send_time = current_time

    cv2.imshow('Eco-Light Detector', annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
client.loop_stop()

```


====================================================================================================
FILE : test_picture.py
====================================================================================================

```py
from ultralytics import YOLO
import cv2

model = YOLO('yolov8n.pt')

results = model.predict(
    r'test_picture.jpg',
    conf=0.25,
    iou=0.45,
    classes=[0],
    imgsz=1280,
    show_labels=False,  # ← hilangkan label
    show_conf=False,    # ← hilangkan confidence score
    save=True,
    show=True
)

print(f"Terdeteksi: {len(results[0].boxes)} orang")

```


====================================================================================================
FILE : train.py
====================================================================================================

```py
from ultralytics import YOLO

model = YOLO('yolov8n.pt')

results = model.train(
    data=r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\data\data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    name='deteksi-kelas',
    patience=10,
    device='cpu'
)

print("Training selesai!")
print(f"Model terbaik: {results.save_dir}/weights/best.pt")

```


====================================================================================================
FILE : zona_loader.py
====================================================================================================

```py
import psycopg2
import psycopg2.extras
import psycopg2.pool
import os
import time
import logging
import threading
from dotenv import load_dotenv

# Load env variables
load_dotenv()
logger = logging.getLogger(__name__)

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        url = os.environ.get("SUPABASE_DATABASE_URL")
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=url,
            sslmode='require'
        )
    return _pool

def get_db_connection():
    pool = get_pool()
    for _ in range(3):
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            return conn
        except Exception as e:
            try:
                pool.putconn(conn, close=True)
            except:
                pass
            logger.warning(f"⚠️ Dead connection detected from pool, retrying...")
    raise Exception("❌ Failed to get a valid DB connection after 3 retries.")

def release_connection(conn, close=False):
    if conn:
        try:
            get_pool().putconn(conn, close=close)
        except Exception as e:
            logger.warning(f"⚠️ Failed to return connection to pool: {e}")

class ZoneManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ZoneManager, cls).__new__(cls)
                cls._instance._init_manager()
            return cls._instance

    def _init_manager(self):
        self.cache = {}
        self.ttl = int(os.getenv("ZONE_CACHE_TTL", 300))
        self._cache_lock = threading.Lock()

    def get_zones(self, camera_id: str) -> list[dict]:
        now = time.time()
        
        # Check cache
        with self._cache_lock:
            cached_data = self.cache.get(camera_id)
            if cached_data:
                cached_zones, timestamp = cached_data
                if now - timestamp < self.ttl:
                    return cached_zones
        
        # Fetch from DB
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT
                        zone_id,
                        room_id,
                        zone_name,
                        zone_status,
                        x1_pct,
                        y1_pct,
                        x2_pct,
                        y2_pct,
                        color,
                        sort_order,
                        COALESCE(skew_x,0) as skew_x,
                        COALESCE(skew_y,0) as skew_y
                    FROM zones
                    WHERE room_id = (
                        SELECT room_id
                        FROM cameras
                        WHERE camera_id = %s
                    )
                    AND zone_status IN ('active','aktif')
                    ORDER BY sort_order
                """, (camera_id,))
                rows = cur.fetchall()
                zones = [dict(row) for row in rows] if rows else []
                
                # Update cache
                with self._cache_lock:
                    self.cache[camera_id] = (zones, now)
                
                return zones
        except Exception as e:
            logger.error(f"❌ Error fetching zones from DB: {e}")
            # Fallback to cache
            with self._cache_lock:
                if cached_data:
                    logger.warning(f"⚠️ Returning stale cache for camera {camera_id} due to DB error.")
                    return cached_data[0]
            return []
        finally:
            if conn:
                close_conn = False
                try:
                    if conn.closed != 0:
                        close_conn = True
                except Exception:
                    close_conn = True
                release_connection(conn, close=close_conn)

def ambil_zona_dari_db(camera_id: str) -> list[dict]:
    return ZoneManager().get_zones(camera_id)

def titik_di_zona(cx_rel: float, cy_rel: float, zona: dict) -> bool:
    x1 = float(zona.get('x1_pct', 0))
    y1 = float(zona.get('y1_pct', 0))
    x2 = float(zona.get('x2_pct', 0))
    y2 = float(zona.get('y2_pct', 0))
    skew_x = float(zona.get('skew_x', 0))
    skew_y = float(zona.get('skew_y', 0))
    
    min_x, max_x = min(x1, x2), max(x1, x2)
    min_y, max_y = min(y1, y2), max(y1, y2)
    
    # Construct 4-point polygon with skew applied
    p1 = (min_x + skew_x, min_y + skew_y)
    p2 = (max_x + skew_x, min_y - skew_y)
    p3 = (max_x - skew_x, max_y - skew_y)
    p4 = (min_x - skew_x, max_y + skew_y)
    
    polygon = [p1, p2, p3, p4]
    
    # Ray-Casting Algorithm
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if min(p1y, p2y) < cy_rel <= max(p1y, p2y):
            if cx_rel <= max(p1x, p2x):
                if p1y != p2y:
                    xints = (cy_rel - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or cx_rel <= xints:
                    inside = not inside
        p1x, p1y = p2x, p2y

    return inside

```

