# ============================================================
# DETEKSI ZONA STANDALONE — TIDAK MENYENTUH main.py
# ============================================================
# Tujuan: Script terpisah untuk test webcam Logitech -> deteksi
#         zona -> kontrol relay ESP32, TANPA mengubah main.py
#         atau database Supabase sama sekali.
#
# Aman untuk dihapus/diganti nanti tanpa pengaruh ke sistem utama.
#
# Install dulu jika belum ada (jalankan di venv service_ai):
#   pip install ultralytics opencv-python paho-mqtt
#
# Cara pakai:
#   cd service_ai
#   .venv\Scripts\Activate.ps1   (kalau belum aktif)
#   python test_standalone_zona.py
# ============================================================

import cv2
import json
import time
from ultralytics import YOLO
import paho.mqtt.client as mqtt

# ============ KONFIGURASI — SESUAIKAN INI ============
MQTT_BROKER = "localhost"       # SAMA dengan MQTT_BROKER di config.h ESP32
MQTT_PORT = 1883
ROOM_ID = "ROM-1464452b"          # SAMA dengan ROOM_ID di config.h ESP32

CAMERA_SOURCE = 1                  # ganti 0/1/2 sesuai webcam Logitech Anda
MODEL_PATH = "yolov8n.pt"

FRAME_WIDTH = 640
ZONE_A_MAX_X = FRAME_WIDTH // 3
ZONE_B_MAX_X = (FRAME_WIDTH // 3) * 2
# =======================================================

# Topic harus PERSIS sama format dengan main.cpp ESP32 Anda:
# topicStr.startsWith("devices/" ROOM_ID "/light/")
def topic_for_channel(channel: int) -> str:
    return f"devices/{ROOM_ID}/light/{channel}"

# Mapping zona huruf -> channel angka (sesuai wiring fisik Anda saat ini)
ZONE_TO_CHANNEL = {"A": 1, "B": 2, "C": 3}

status_zona = {"A": False, "B": False, "C": False}

print("[INIT] Memuat model YOLOv8n...")
model = YOLO(MODEL_PATH)
print("[INIT] Model siap")

print(f"[INIT] Menghubungkan ke MQTT broker {MQTT_BROKER}:{MQTT_PORT} ...")
client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()
print("[INIT] Terhubung ke MQTT")


def kirim_perintah(zone: str, nyala: bool):
    """Kirim perintah ke ESP32 sesuai format yang SUDAH TERBUKTI jalan:
    topic: devices/{ROOM_ID}/light/{channel}
    payload: {"command":"on"} atau {"command":"off"}
    """
    channel = ZONE_TO_CHANNEL[zone]
    topic = topic_for_channel(channel)
    payload = json.dumps({"command": "on" if nyala else "off"})
    client.publish(topic, payload)
    print(f"[MQTT] >> {topic}  payload={payload}")


def tentukan_zona(center_x: int) -> str:
    if center_x < ZONE_A_MAX_X:
        return "A"
    elif center_x < ZONE_B_MAX_X:
        return "B"
    else:
        return "C"


def main():
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    if not cap.isOpened():
        print(f"[ERROR] Kamera index {CAMERA_SOURCE} tidak bisa dibuka!")
        print("[ERROR] Coba ganti CAMERA_SOURCE ke 0, 1, atau 2 lalu jalankan ulang")
        return

    print("[RUN] Kamera terbuka. Tekan 'q' di jendela video untuk berhenti.")
    print("[RUN] Berdiri di kiri/tengah/kanan frame untuk test Zona A/B/C\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Gagal membaca frame dari kamera")
            break

        frame = cv2.resize(frame, (FRAME_WIDTH, 480))
        results = model(frame, verbose=False, conf=0.4, classes=[0])  # 0 = person

        zona_terdeteksi = {"A": False, "B": False, "C": False}

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                center_x = (x1 + x2) // 2
                zona = tentukan_zona(center_x)
                zona_terdeteksi[zona] = True

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Person - Zona {zona}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        for zona in ["A", "B", "C"]:
            if zona_terdeteksi[zona] != status_zona[zona]:
                status_zona[zona] = zona_terdeteksi[zona]
                kirim_perintah(zona, zona_terdeteksi[zona])

        cv2.line(frame, (ZONE_A_MAX_X, 0), (ZONE_A_MAX_X, 480), (255, 255, 0), 1)
        cv2.line(frame, (ZONE_B_MAX_X, 0), (ZONE_B_MAX_X, 480), (255, 255, 0), 1)
        cv2.putText(frame, "ZONA A", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, "ZONA B", (ZONE_A_MAX_X + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, "ZONA C", (ZONE_B_MAX_X + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

        cv2.imshow("Standalone Test - Deteksi Zona (webcam)", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    for zona in ["A", "B", "C"]:
        if status_zona[zona]:
            kirim_perintah(zona, False)

    cap.release()
    cv2.destroyAllWindows()
    client.loop_stop()
    client.disconnect()
    print("[EXIT] Selesai, semua zona di-OFF-kan")


if __name__ == "__main__":
    main()