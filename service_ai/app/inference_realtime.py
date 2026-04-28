import cv2
from ultralytics import YOLO
import paho.mqtt.client as mqtt
import json
import time
from zona_loader import ambil_zona_dari_db, titik_di_zona

# Define the target camera ID this inference process handles
# For a more robust solution, this could be passed as a command-line arg or env var
ID_KAMERA = 1 

model = YOLO('yolov8n.pt')

client = mqtt.Client()
client.connect('localhost', 1883)
client.loop_start()

cap = cv2.VideoCapture(0)
print("✅ Kamera aktif! Tekan 'q' untuk keluar")

prev_data = {}
last_send_time = 0
SEND_INTERVAL = 2

# Zone reloading logic
zones = []
last_zone_fetch_time = 0
ZONE_FETCH_INTERVAL = 60 # Reload every 60 seconds

while True:
    current_time = time.time()
    
    # Reload zones periodically
    if (current_time - last_zone_fetch_time) > ZONE_FETCH_INTERVAL or not zones:
        zones = ambil_zona_dari_db(ID_KAMERA)
        last_zone_fetch_time = current_time
        print(f"🔄 Reloaded {len(zones)} zones from DB.")

    ret, frame = cap.read()
    if not ret:
        break

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

    annotated = results[0].plot()

    # Hitung orang per zona
    # Initialize counts based on loaded zones dynamically
    count = {z['nama_zona']: 0 for z in zones}
    count['total'] = 0

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        
        # Calculate relative coordinates
        cx_rel = cx / width
        cy_rel = cy / height

        # Assign to zone
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z['nama_zona']] += 1
                break # count each person only in one zone (or remove break to count in overlapping)

        count['total'] += 1

    # Status lampu
    status = 'ON' if count['total'] > 0 else 'OFF'
    
    # ── Kirim MQTT setiap 2 detik ───────────────
    if count != prev_data and (current_time - last_send_time) > SEND_INTERVAL:
        # Dynamic payload
        payload_data = count.copy()
        payload_data['lampu'] = status
        
        payload = json.dumps(payload_data)
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