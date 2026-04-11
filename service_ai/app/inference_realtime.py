import cv2
from ultralytics import YOLO
import paho.mqtt.client as mqtt
import json
import time

# ── Konfigurasi ──────────────────────────────────────
MODEL_PATH = 'app/models/best.pt'
MQTT_BROKER = 'localhost'
MQTT_PORT   = 1883
MQTT_TOPIC  = 'kelas/deteksi'
CONFIDENCE  = 0.5
# ─────────────────────────────────────────────────────

# Load model
model = YOLO(MODEL_PATH)

# Setup MQTT
client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT)
client.loop_start()

# Buka kamera (0 = webcam laptop, atau ganti URL IP cam)
cap = cv2.VideoCapture(0)

print("Inferensi dimulai... Tekan 'q' untuk keluar")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    height, width = frame.shape[:2]

    # ── Bagi frame menjadi 3 zona ─────────────────────
    zona_kiri   = width // 3
    zona_tengah = 2 * width // 3

    # Deteksi objek
    results = model.predict(frame, conf=CONFIDENCE, verbose=False)

    # Hitung orang per zona
    count = {'kiri': 0, 'tengah': 0, 'kanan': 0, 'total': 0}

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2  # titik tengah bounding box

        if cx < zona_kiri:
            count['kiri'] += 1
            color = (0, 255, 0)    # hijau
        elif cx < zona_tengah:
            count['tengah'] += 1
            color = (255, 165, 0)  # oranye
        else:
            count['kanan'] += 1
            color = (0, 0, 255)    # merah

        count['total'] += 1

        # Gambar bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, 'person', (x1, y1-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # ── Gambar garis zona ────────────────────────────
    cv2.line(frame, (zona_kiri, 0), (zona_kiri, height), (200,200,200), 1)
    cv2.line(frame, (zona_tengah, 0), (zona_tengah, height), (200,200,200), 1)

    # ── Tampilkan jumlah per zona ─────────────────────
    cv2.putText(frame, f"Kiri: {count['kiri']}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
    cv2.putText(frame, f"Tengah: {count['tengah']}",
                (width//3 + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,165,0), 2)
    cv2.putText(frame, f"Kanan: {count['kanan']}",
                (2*width//3 + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
    cv2.putText(frame, f"Total: {count['total']}",
                (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)

    # ── Kirim ke MQTT setiap 1 detik ─────────────────
    payload = json.dumps(count)
    client.publish(MQTT_TOPIC, payload)

    cv2.imshow('Deteksi Kelas Real-time', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
client.loop_stop()