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
    from app.zona_loader import ambil_zona_dari_db, titik_di_zona, get_db_connection, release_connection
except ImportError:
    from zona_loader import ambil_zona_dari_db, titik_di_zona, get_db_connection, release_connection

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
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id="service_ai_multicam",
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

def open_capture(cam_source):
    if isinstance(cam_source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(cam_source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(cam_source)
        cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)   # 5 detik timeout koneksi
        cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)   # 5 detik timeout baca frame
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

        if count != prev_data:
            topic = f"ai/inference/result/{camera_id}"
            payload = {**count, "lampu": status, "camera_id": camera_id}
            if mqtt_handler.publish(topic, payload):
                log.info(f"📤 [{camera_id}] {payload}")

            try:
                from app.decision_engine import decision_engine
                from app.log_writer import write_detection_logs
                decision_engine.process_inference(camera_id, count)
                write_detection_logs(camera_id, count)
            except Exception as e:
                log.error(f"❌ [{camera_id}] Decision/log error: {e}")

            prev_data = count.copy()

        time.sleep(SNAPSHOT_INTERVAL)

    log.info(f"🛑 [{camera_id}] Worker stopped.")

# ─── Entry point ──────────────────────────────────────────────────────────────
def run():
    mqtt_handler = MQTTHandler()
    mqtt_handler.connect()

<<<<<<< HEAD
    # Init zona manager
    zone_mgr = ZoneManager(ID_KAMERA, ZONE_FETCH_INTERVAL)

    # Init model
    log.info(f"🔃 Loading YOLOv8 model from {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    log.info("✅ Model loaded.")

    # Init kamera
    if isinstance(camera_input, int) and os.name == 'nt':
        cap = cv2.VideoCapture(camera_input, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(camera_input)

    print("Camera source =", camera_input)
    print("Opened =", cap.isOpened())
        
    if not cap.isOpened():
        log.error(f"❌ Kamera tidak bisa dibuka: {CAMERA_SOURCE}")
=======
    cameras = get_active_cameras()
    if not cameras:
        log.error("❌ Tidak ada kamera aktif di DB. Service berhenti.")
>>>>>>> d4f53454148a5c44fe6bd85d396c4df0bbf4b123
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