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

    # ── Bagi frame jadi 3 zona HORIZONTAL ──────
    zona1 = height // 3        # batas atas-tengah
    zona2 = 2 * height // 3   # batas tengah-bawah

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
    count = {'atas': 0, 'tengah': 0, 'bawah': 0, 'total': 0}

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cy = (y1 + y2) // 2  # titik tengah vertikal box

        if cy < zona1:
            count['atas'] += 1
        elif cy < zona2:
            count['tengah'] += 1
        else:
            count['bawah'] += 1

        count['total'] += 1

    # ── Gambar garis zona horizontal ────────────
    cv2.line(annotated, (0, zona1), (width, zona1), (255, 255, 0), 2)
    cv2.line(annotated, (0, zona2), (width, zona2), (255, 255, 0), 2)

    # ── Label nama zona di garis ────────────────
    cv2.putText(annotated, "ZONA ATAS",
                (10, zona1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    cv2.putText(annotated, "ZONA TENGAH",
                (10, zona2 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    cv2.putText(annotated, "ZONA BAWAH",
                (10, height - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # ── Info jumlah orang ───────────────────────
    cv2.putText(annotated, f"Atas  : {count['atas']}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(annotated, f"Tengah: {count['tengah']}",
                (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(annotated, f"Bawah : {count['bawah']}",
                (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(annotated, f"Total : {count['total']}",
                (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # Status lampu
    status = 'ON' if count['total'] > 0 else 'OFF'
    cv2.putText(annotated, f"Lampu : {status}",
                (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                (0, 255, 0) if status == 'ON' else (0, 0, 255), 2)

    # ── Kirim MQTT setiap 2 detik ───────────────
    current_time = time.time()
    if count != prev_data and (current_time - last_send_time) > SEND_INTERVAL:
        payload = json.dumps({
            'zona_atas': count['atas'],
            'zona_tengah': count['tengah'],
            'zona_bawah': count['bawah'],
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