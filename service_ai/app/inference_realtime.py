import cv2
import json
import logging
import os
import time

import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from ultralytics import YOLO

from zona_loader import ambil_zona_dari_db, titik_di_zona

load_dotenv()

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Config ─────────────────────────────────────────────────────────────────
MQTT_BROKER         = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT           = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER           = os.getenv("MQTT_USER")
MQTT_PASSWORD       = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC_TRIGGER  = os.getenv("MQTT_TOPIC_TRIGGER", "camera/trigger")
MQTT_TOPIC_RESULT   = os.getenv("MQTT_TOPIC_RESULT", "ai/inference/result")
MQTT_TOPIC_CONTROL  = os.getenv("MQTT_TOPIC_CONTROL", "kelas/control")

CAMERA_SOURCE       = os.getenv("CAMERA_SOURCE", "0")
ID_KAMERA           = int(os.getenv("ID_KAMERA", 1))

SEND_INTERVAL       = float(os.getenv("SEND_INTERVAL", 2))       # detik
ZONE_FETCH_INTERVAL = float(os.getenv("ZONE_FETCH_INTERVAL", 60)) # detik
CONF_THRESHOLD      = float(os.getenv("CONF_THRESHOLD", 0.25))
IOU_THRESHOLD       = float(os.getenv("IOU_THRESHOLD", 0.45))

MODEL_PATH          = os.getenv("MODEL_PATH", "yolov8n.pt")

camera_input = int(CAMERA_SOURCE) if CAMERA_SOURCE.isdigit() else CAMERA_SOURCE


# ─── MQTT Handler ────────────────────────────────────────────────────────────
class MQTTHandler:
    def __init__(self):
        self.connected = False
        # Fix: gunakan CallbackAPIVersion untuk paho-mqtt v2+
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=f"service_ai_{ID_KAMERA}",
        )
        if MQTT_USER and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

        self.client.on_connect    = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        # Auto-reconnect bawaan paho
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            self.connected = True
            log.info(f"✅ MQTT terhubung ke {MQTT_BROKER}:{MQTT_PORT}")
            # Subscribe topic control (start/stop service via MQTT)
            client.subscribe(MQTT_TOPIC_CONTROL)
        else:
            self.connected = False
            log.error(f"❌ MQTT gagal connect, kode: {reason_code}")

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        self.connected = False
        log.warning(f"⚠️  MQTT terputus (kode: {reason_code}), mencoba reconnect...")

    def connect(self):
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            log.error(f"❌ Tidak bisa connect ke MQTT: {e}")
            raise

    def publish(self, topic: str, payload: dict) -> bool:
        """Publish payload, return False jika tidak terkoneksi."""
        if not self.connected:
            log.warning("⚠️  MQTT tidak terhubung, skip publish.")
            return False
        result = self.client.publish(topic, json.dumps(payload), qos=1)
        return result.rc == mqtt.MQTT_ERR_SUCCESS

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()


# ─── Zone Manager ─────────────────────────────────────────────────────────────
class ZoneManager:
    def __init__(self, id_kamera: int, fetch_interval: float):
        self.id_kamera      = id_kamera
        self.fetch_interval = fetch_interval
        self.zones          = []
        self._last_fetch    = 0.0

    def get_zones(self) -> list:
        """Return zones, reload dari DB jika sudah expired."""
        now = time.time()
        if (now - self._last_fetch) >= self.fetch_interval or not self.zones:
            try:
                self.zones       = ambil_zona_dari_db(self.id_kamera)
                self._last_fetch = now
                log.info(f"🔄 Reloaded {len(self.zones)} zona dari DB.")
            except Exception as e:
                log.error(f"❌ Gagal fetch zona: {e}")
        return self.zones


# ─── Inference ────────────────────────────────────────────────────────────────
def hitung_per_zona(boxes, zones: list, width: int, height: int) -> dict:
    """
    Hitung jumlah orang per zona dan total.
    Orang yang tidak masuk zona manapun tetap dihitung di 'total'
    tapi tidak menambah count zona (konsisten).
    """
    count = {z["zone_name"]: 0 for z in zones}
    count["luar_zona"] = 0  # ✅ Fix: orang di luar semua zona
    count["total"]     = 0

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


def run():
    # Init MQTT
    mqtt_handler = MQTTHandler()
    mqtt_handler.connect()

    # Init zona manager
    zone_mgr = ZoneManager(ID_KAMERA, ZONE_FETCH_INTERVAL)

    # Init model
    log.info(f"🔃 Loading YOLOv8 model from {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    log.info("✅ Model loaded.")

    # Init kamera
    cap = cv2.VideoCapture(camera_input)
    if not cap.isOpened():
        log.error(f"❌ Kamera tidak bisa dibuka: {CAMERA_SOURCE}")
        mqtt_handler.stop()
        return

    log.info(f"✅ Kamera aktif (source: {CAMERA_SOURCE})")
    log.info("▶️  Inferensi berjalan. Tekan Ctrl+C untuk keluar.")

    prev_data      = {}
    last_send_time = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                log.warning("⚠️  Frame tidak terbaca, mencoba lagi...")
                time.sleep(0.5)
                continue

            height, width = frame.shape[:2]
            zones         = zone_mgr.get_zones()

            results = model.predict(
                frame,
                conf=CONF_THRESHOLD,
                iou=IOU_THRESHOLD,
                classes=[0],        # hanya 'person'
                show_labels=False,
                show_conf=False,
                verbose=False,
            )

            count  = hitung_per_zona(results[0].boxes, zones, width, height)
            status = "ON" if count["total"] > 0 else "OFF"

            now = time.time()
            if count != prev_data and (now - last_send_time) >= SEND_INTERVAL:
                payload = {**count, "lampu": status, "camera_id": ID_KAMERA}
                if mqtt_handler.publish(MQTT_TOPIC_RESULT, payload):
                    log.info(f"📤 {payload}")
                prev_data      = count.copy()
                last_send_time = now

    except KeyboardInterrupt:
        log.info("\n🛑 Dihentikan oleh user.")

    finally:
        cap.release()
        mqtt_handler.stop()
        log.info("✅ Resource dilepas, service berhenti.")


if __name__ == "__main__":
    run()