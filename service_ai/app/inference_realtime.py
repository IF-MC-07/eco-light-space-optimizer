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
    from app.mqtt_subscriber import mqtt_client
    from app.decision_engine import decision_engine
    from app.log_writer import write_detection_logs
    from app.occupancy_store import record_count
except ImportError:
    from zona_loader import ambil_zona_dari_db, titik_di_zona
    from camera_loader import get_camera_stream_source, get_active_camera_sources
    from mqtt_subscriber import mqtt_client
    from decision_engine import decision_engine
    from log_writer import write_detection_logs
    from occupancy_store import record_count

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
DETECTION_LOG_INTERVAL = float(os.getenv("DETECTION_LOG_INTERVAL", 120)) # 2-3 menit (120 detik)
CONF_THRESHOLD     = float(os.getenv("CONF_THRESHOLD", 0.30))
IOU_THRESHOLD      = float(os.getenv("IOU_THRESHOLD", 0.45))
MODEL_PATH         = os.getenv("MODEL_PATH", "yolov8n.pt")
API_URL            = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY  = os.getenv("CAMERA_SECRET_KEY")

_imgsz_warned: set = set()

def _parse_imgsz(val):
    if val is None:
        return None
    if isinstance(val, int):
        if val > 0:
            return val
        repr_val = repr(val)
        if repr_val not in _imgsz_warned:
            _imgsz_warned.add(repr_val)
            log.warning(f"⚠️ INFERENCE_IMGSZ tidak valid: {val!r}, diabaikan")
        return None
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return None
        try:
            parsed = int(s)
            if parsed > 0:
                return parsed
            if s not in _imgsz_warned:
                _imgsz_warned.add(s)
                log.warning(f"⚠️ INFERENCE_IMGSZ tidak valid: {val!r}, diabaikan")
            return None
        except ValueError:
            if s not in _imgsz_warned:
                _imgsz_warned.add(s)
                log.warning(f"⚠️ INFERENCE_IMGSZ tidak valid: {val!r}, diabaikan")
            return None
    repr_val = repr(val)
    if repr_val not in _imgsz_warned:
        _imgsz_warned.add(repr_val)
        log.warning(f"⚠️ INFERENCE_IMGSZ tidak valid: {val!r}, diabaikan")
    return None

def get_inference_imgsz():
    """Mengembalikan ukuran imgsz inferensi (int positif atau None)."""
    return _parse_imgsz(os.getenv("INFERENCE_IMGSZ"))

def get_fallback_model_path():
    """Mengembalikan path model fallback dari env FALLBACK_MODEL_PATH.
    - None jika env tidak diatur atau kosong (fallback nonaktif).
    - String path jika env berisi path non-kosong (fallback aktif).
    """
    env_val = os.getenv("FALLBACK_MODEL_PATH")
    if env_val is None:
        return None
    env_val = env_val.strip()
    if env_val == "":
        return None
    return env_val

def get_predict_kwargs():
    """Mengembalikan argumen kwargs untuk predict().
    Jika INFERENCE_IMGSZ diatur (positif), imgsz disertakan; jika tidak, tidak dikirim.
    """
    kwargs = {
        "conf": CONF_THRESHOLD,
        "iou": IOU_THRESHOLD,
        "classes": [0],
        "verbose": False,
        "save": False,
        "save_txt": False,
    }
    imgsz = get_inference_imgsz()
    if imgsz is not None:
        kwargs["imgsz"] = imgsz
    return kwargs

# Fix untuk RTSP timeout (tambahkan stimeout agar tidak hang 30 detik)
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|stimeout;5000000|timeout;5000000"

# ─── Shared Model + Lock ─────────────────────────────────────────────────────
_model_primary = None
_model_fallback = None
_models_loaded = False
_model_lock = threading.Lock()
_frame_buffer = {}
_frame_buffer_lock = threading.Lock()

def get_latest_frame(camera_id: str):
    """Dipanggil dari snapshot.py. Return dict {frame, annotated, zones, count, timestamp} atau None."""
    with _frame_buffer_lock:
        data = _frame_buffer.get(camera_id)
        return data.copy() if data else None

def _store_frame(camera_id: str, frame, annotated, zones, count):
    with _frame_buffer_lock:
        _frame_buffer[camera_id] = {
            "frame": frame,
            "annotated": annotated,
            "zones": zones,
            "count": count,
            "timestamp": time.time(),
        }
        

def get_model():
    global _model_primary, _model_fallback, _models_loaded
    
    if not _models_loaded or (_model_primary is None and _model_fallback is None):
        primary_path = os.getenv("MODEL_PATH", "yolov8n.pt")
        fallback_path = get_fallback_model_path()
        
        # Load Primary Model
        try:
            log.info(f"🔃 Loading Primary YOLOv8 model from {primary_path}...")
            _model_primary = YOLO(primary_path)
            log.info("✅ Primary Model loaded.")
        except Exception as e:
            log.error(f"❌ Primary model load failed: {e}")
            _model_primary = None

        # Load Fallback Model
        if fallback_path is None:
            _model_fallback = None
            log.info("ℹ️ fallback dinonaktifkan")
        else:
            try:
                log.info(f"🔃 Loading Fallback YOLOv8 model from {fallback_path}...")
                _model_fallback = YOLO(fallback_path)
                log.info("✅ Fallback Model loaded.")
            except Exception as e:
                log.error(f"❌ Fallback model load failed: {e}")
                _model_fallback = None
                
        _models_loaded = True

        fallback_desc = fallback_path if fallback_path else "dinonaktifkan"
        eff_imgsz = get_inference_imgsz()
        imgsz_desc = eff_imgsz if eff_imgsz is not None else "default"
        log.info(
            f"ℹ️ Model loaded: primary={primary_path}, fallback={fallback_desc}, "
            f"conf={CONF_THRESHOLD}, iou={IOU_THRESHOLD}, imgsz={imgsz_desc}"
        )
            
    return _model_primary, _model_fallback

# ─── MQTT Handler ─────────────────────────────────────────────────────────────
class MQTTHandler:
    def __init__(self):
        self.connected = False
        self.client = mqtt_client

    def connect(self):
        try:
            self.client.start()
            self.connected = True
        except Exception as e:
            self.connected = False
            log.error(f"❌ MQTT gagal connect via shared subscriber: {e}")

    def publish(self, topic: str, payload: dict) -> bool:
        if not self.connected:
            self.connect()
        return self.client.publish(topic, payload)

    def stop(self):
        try:
            self.client.stop()
        finally:
            self.connected = False

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
def _maybe_process_decision(camera_id: str, occupancy_counts: dict, engine, last_decision_call: float, now: float, throttle_seconds: float = 1.0):
    if now - last_decision_call < throttle_seconds:
        return last_decision_call

    try:
        engine.process_inference(camera_id, occupancy_counts)
    except Exception as exc:
        log.error(f"❌ [{camera_id}] Decision engine failed: {exc}")

    return now


def camera_worker(camera_id: str, ip_address: str, mqtt_handler: MQTTHandler, stop_event: threading.Event):
    log.info(f"🎥 Starting worker for {camera_id} ({ip_address})")

    cam_source = int(ip_address) if ip_address.isdigit() else ip_address

    print(f"DEBUG cam_source = {cam_source}")
    print(f"DEBUG type = {type(cam_source)}")

    zones = []
    last_zone_fetch = 0.0
    last_decision_call = 0.0
    last_detection_log_time = 0.0
    prev_occupancy_state = None

    cap = open_capture(cam_source)

    print(f"DEBUG cap.isOpened() = {cap.isOpened()}")

    while not stop_event.is_set():
        now = time.time()

        if (now - last_zone_fetch) >= ZONE_FETCH_INTERVAL or last_zone_fetch == 0.0:
            try:
                zones = ambil_zona_dari_db(camera_id)
                last_zone_fetch = now
                log.info(f"🔄 [{camera_id}] Reloaded {len(zones)} zona dari DB.")
            except Exception as e:
                log.error(f"❌ [{camera_id}] Gagal fetch zona: {e}")

        try:
            if cap is None or not cap.isOpened():
                log.warning(f"⚠️ [{camera_id}] Kamera tidak terbuka, reopen dalam {SNAPSHOT_INTERVAL}s")
                try:
                    cap.release()
                except Exception:
                    pass
                time.sleep(SNAPSHOT_INTERVAL)
                cap = open_capture(cam_source)
                continue

            ret, frame = cap.read()

            if not ret:
                log.warning(f"⚠️ [{camera_id}] Frame tidak terbaca, reconnect.")
                cap.release()
                cap = open_capture(cam_source)
                time.sleep(SNAPSHOT_INTERVAL)
                continue

        except Exception as e:
            log.error(f"❌ [{camera_id}] Error capture: {e}")
            try:
                cap.release()
            except Exception:
                pass
            cap = open_capture(cam_source)
            time.sleep(SNAPSHOT_INTERVAL)
            continue

        # Inference dengan lock
        try:
            with _model_lock:
                primary_model, fallback_model = get_model()
                
                results = None
                predict_kwargs = get_predict_kwargs()
                
                # 1. Coba deteksi menggunakan model Utama (MODEL_PATH)
                if primary_model is not None:
                    results = primary_model.predict(
                        frame,
                        **predict_kwargs,
                    )
                
                # 2. Model fallback dari FALLBACK_MODEL_PATH dan hanya dipakai bila model utama menghasilkan nol box (atau gagal)
                if fallback_model is not None:
                    if results is None or len(results[0].boxes) == 0:
                        results = fallback_model.predict(
                            frame,
                            **predict_kwargs,
                        )
                        
                if results is None:
                    raise ValueError("Tidak ada model yang berhasil dimuat.")
                    
        except Exception as e:
            log.error(f"❌ [{camera_id}] Inference error: {e}")
            time.sleep(SNAPSHOT_INTERVAL)
            continue

        height, width = frame.shape[:2]
        count = hitung_per_zona(results[0].boxes, zones, width, height)
        status = "ON" if count["total"] > 0 else "OFF"

        try:
            record_count(camera_id, int(count["total"]))
        except Exception as e:
            log.warning(f"⚠️ [{camera_id}] DSLB record_count error: {e}")

        now2 = time.time()
        last_decision_call = _maybe_process_decision(
            camera_id,
            count,
            decision_engine,
            last_decision_call,
            now2,
            throttle_seconds=1.0,
        )

        curr_state = count["total"] > 0
        if (now2 - last_detection_log_time >= DETECTION_LOG_INTERVAL) or (prev_occupancy_state != curr_state):
            try:
                write_detection_logs(camera_id, count)
                last_detection_log_time = now2
                prev_occupancy_state = curr_state
            except Exception as e:
                log.error(f"❌ [{camera_id}] Gagal mencatat detection_logs: {e}")

        try:
            annotated = results[0].plot()
            for z in zones:
                zx1, zy1 = int((z.get('x1_pct') or 0) * width), int((z.get('y1_pct') or 0) * height)
                zx2, zy2 = int((z.get('x2_pct') or 0) * width), int((z.get('y2_pct') or 0) * height)
                hex_color = (z.get('color') or '#00FF00').lstrip('#')
                try:
                    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
                    color = (b, g, r)
                except Exception:
                    color = (0, 255, 0)
                cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), color, 2)
                cv2.putText(annotated, f"{z['zone_name']} | Orang: {count.get(z['zone_name'], 0)}",
                            (zx1, zy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            _store_frame(camera_id, frame, annotated, zones, count)
        except Exception as e:
            log.error(f"❌ [{camera_id}] Gagal simpan frame buffer: {e}")
# ─── Entry point ──────────────────────────────────────────────────────────────
def run():
    mqtt_handler = MQTTHandler()
    try:
        mqtt_client.start()
        mqtt_handler.connected = True
    except Exception as e:
        log.error(f"❌ Gagal memulai shared MQTT client: {e}")
        mqtt_handler.stop()
        return

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