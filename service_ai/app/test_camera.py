import cv2
from ultralytics import YOLO
import paho.mqtt.client as mqtt
import json
import time

model = YOLO('yolov8n.pt')

client = mqtt.Client()
client.connect('localhost', 1883)
client.loop_start()

cap = cv2.VideoCapture(0)
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
        client.publish('kelas/deteksi', payload)
        print(f"📤 {payload}")
        prev_data = count.copy()
        last_send_time = current_time

    cv2.imshow('Eco-Light Detector', annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
client.loop_stop()