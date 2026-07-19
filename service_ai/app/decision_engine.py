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

        # NOTE: delay_on_light sudah dalam satuan DETIK (sesuai nama env var)
        self.delay_on_light = float(os.getenv("DELAY_ON_LIGHT_SECONDS", 5))

        # NOTE: delay_on_ac dan delay_off disimpan dalam satuan MENIT (sesuai nama env var),
        # tapi time.time() selalu menghasilkan detik. Maka WAJIB dikonversi ke detik
        # di titik penggunaan (atau disimpan langsung dalam bentuk *_seconds agar tidak ambigu).
        self.delay_on_ac = float(os.getenv("DELAY_ON_AC_MINUTES", 3))
        self.delay_off_minutes = float(os.getenv("DELAY_OFF_MINUTES", 5))
        self.delay_off_seconds = self.delay_off_minutes * 60  # <-- konversi eksplisit, dipakai di process_inference

        logger.info(
            f"⚙️ Decision Engine Initialized - ON Light: {self.delay_on_light}s | "
            f"ON AC: {self.delay_on_ac}min | OFF: {self.delay_off_minutes}min "
            f"({self.delay_off_seconds:.0f}s)"
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
                        "current_status": (ac_row[0] if ac_row else "OFF").upper()
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

                    for zone in active_room_zones:
                        z_id = zone["zone_id"]
                        z_name = zone["zone_name"]
                        count = occupancy_counts.get(z_name, 0)

                        logger.debug(f"[STATE] Zone {z_name} | Count: {count} | Status: {zone['current_status']}")

                        if count > 0:
                            zone["empty_since"] = None  # Reset timer kosong

                            if zone["current_status"] == "OFF":
                                if zone["occupied_since"] is None:
                                    zone["occupied_since"] = now
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

                                    cur.execute("UPDATE light_controls SET light_status = 'ON', updated_at = NOW() WHERE zone_id = %s", (z_id,))
                                    conn.commit()
                                    logger.info(f"🟢 Lampu ON - Zone '{z_name}' (Relay {relay_channel})")

                        else:
                            zone["occupied_since"] = None

                            if zone["current_status"] == "ON":
                                if zone["empty_since"] is None:
                                    zone["empty_since"] = now
                                    logger.debug(f"[EMPTY] Zone {z_name} mulai kosong")

                                elapsed = now - zone["empty_since"]

                                # FIX: gunakan konfigurasi delay_off_seconds (default 5 menit = 300 detik),
                                # BUKAN angka hardcode. Sebelumnya di-hardcode ke 30 detik untuk testing
                                # dan tidak pernah di-revert, menyebabkan lampu mati terlalu cepat
                                # (berisiko mempercepat keausan kontak relay akibat switching berlebihan).
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

                                    cur.execute("UPDATE light_controls SET light_status = 'OFF', updated_at = NOW() WHERE zone_id = %s", (z_id,))
                                    conn.commit()
                                    logger.info(f"🔴 Lampu OFF - Zone '{z_name}' (Relay {relay_channel})")

            except Exception as e:
                logger.error(f"❌ Process inference error: {e}")
            finally:
                # FIX: finally hanya untuk resource cleanup (release koneksi DB).
                # Blok duplikat logika bisnis yang sebelumnya ada di sini (dan berisiko
                # NameError karena mereferensikan variabel loop yang belum tentu terdefinisi)
                # sudah dihapus. Logika ON/OFF sepenuhnya ditangani di dalam try-block di atas.
                if conn:
                    from app.zona_loader import release_connection
                    release_connection(conn)


# Singleton
decision_engine = DecisionEngine()