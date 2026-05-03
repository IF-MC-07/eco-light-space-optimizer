import cv2
from ultralytics import YOLO
import paho.mqtt.client as mqtt
import json
import time
import os
from dotenv import load_dotenv
from zona_loader import ambil_zona_dari_db, titik_di_zona

load_dotenv()

# --- Config dari .env ---
MQTT_BROKER   = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT     = int(os.getenv('MQTT_PORT', 1883))
MQTT_USER     = os.getenv('MQTT_USER')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD')
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', '0')
ID_KAMERA     = 1

# Konversi CAMERA_SOURCE: angka = index webcam, string = RTSP URL
camera_input = int(CAMERA_SOURCE) if CAMERA_SOURCE.isdigit() else CAMERA_SOURCE

model = YOLO('yolov8n.pt')

# --- MQTT dengan auth ---
client = mqtt.Client()
if MQTT_USER and MQTT_PASSWORD:
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
client.connect(MQTT_BROKER, MQTT_PORT)
client.loop_start()
print(f"✅ MQTT terhubung ke {MQTT_BROKER}:{MQTT_PORT}")

cap = cv2.VideoCapture(camera_input)
if not cap.isOpened():
    print(f"❌ Kamera tidak bisa dibuka: {CAMERA_SOURCE}")
    client.loop_stop()
    exit(1)
print(f"✅ Kamera aktif (source: {CAMERA_SOURCE})")

prev_data      = {}
last_send_time = 0
SEND_INTERVAL  = 2

zones               = []
last_zone_fetch_time = 0
ZONE_FETCH_INTERVAL = 60

print("▶️  Inferensi berjalan. Tekan Ctrl+C untuk keluar.")

try:
    while True:
        current_time = time.time()

        # Reload zona secara berkala
        if (current_time - last_zone_fetch_time) > ZONE_FETCH_INTERVAL or not zones:
            zones = ambil_zona_dari_db(ID_KAMERA)
            last_zone_fetch_time = current_time
            print(f"🔄 Reloaded {len(zones)} zones dari DB.")

        ret, frame = cap.read()
        if not ret:
            print("⚠️  Frame tidak terbaca, mencoba lagi...")
            time.sleep(0.5)
            continue

        height, width = frame.shape[:2]

        results = model.predict(
            frame,
            conf=0.25,
            iou=0.45,
            classes=[0],
            show_labels=False,
            show_conf=False,
            verbose=False
        )

        # Hitung orang per zona
        count = {z['nama_zona']: 0 for z in zones}
        count['total'] = 0

        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            cx_rel = cx / width
            cy_rel = cy / height

            for z in zones:
                if titik_di_zona(cx_rel, cy_rel, z):
                    count[z['nama_zona']] += 1
                    break

            count['total'] += 1

        status = 'ON' if count['total'] > 0 else 'OFF'

        # Kirim MQTT setiap 2 detik jika ada perubahan
        if count != prev_data and (current_time - last_send_time) > SEND_INTERVAL:
            payload_data          = count.copy()
            payload_data['lampu'] = status
            payload               = json.dumps(payload_data)
            client.publish('kelas/deteksi', payload)
            print(f"📤 {payload}")
            prev_data      = count.copy()
            last_send_time = current_time

except KeyboardInterrupt:
    print("\n🛑 Dihentikan oleh user.")

finally:
    cap.release()
    client.loop_stop()
    print("✅ Resource dilepas, service berhenti.")