from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import psycopg2
import psycopg2.extras
import os
import io
import asyncio
import time
from ultralytics import YOLO
from app.zona_loader import ambil_zona_dari_db, titik_di_zona, get_db_connection

app = FastAPI()
model = YOLO('app/models/best.pt')

def get_kamera_ip(id_kamera: int) -> str:
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT ip_address FROM kamera WHERE id_kamera = %s", (id_kamera,))
            row = cur.fetchone()
            if row:
                return row['ip_address']
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        if 'conn' in locals() and not conn.closed:
            conn.close()
    return None

def process_frame(frame, id_kamera, zones):
    height, width = frame.shape[:2]

    # Run YOLO
    results = model.predict(
        frame,  
        conf=0.20,
        verbose=False
    )
    
    # Plot YOLO results (bounding boxes)
    annotated = results[0].plot()

    # Calculate counts
    count = {z['nama_zona']: 0 for z in zones}
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx_rel = ((x1 + x2) // 2) / width
        cy_rel = ((y1 + y2) // 2) / height
        
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z['nama_zona']] += 1
                break

    # Draw zones
    for z in zones:
        zx1, zy1 = int(z['x1_pct'] * width), int(z['y1_pct'] * height)
        zx2, zy2 = int(z['x2_pct'] * width), int(z['y2_pct'] * height)
        # Parse hex color safely
        hex_color = z['warna'].lstrip('#')
        try:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            color = (b, g, r) # OpenCV uses BGR
        except:
            color = (0, 255, 0)
            
        cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), color, 2)
        cv2.putText(annotated, f"{z['nama_zona']} | Orang: {count[z['nama_zona']]}", 
                    (zx1, zy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return annotated

async def frame_generator(id_kamera: int):
    ip_address = get_kamera_ip(id_kamera)
    cam_source = 0
    if ip_address:
        if ip_address.isdigit():
            cam_source = int(ip_address)
        else:
            cam_source = ip_address
            
    cap = cv2.VideoCapture(cam_source)
    if not cap.isOpened():
        raise HTTPException(status_code=503, detail="Kamera tidak dapat diakses")

    zones = []
    last_zone_fetch = 0
    ZONE_FETCH_INTERVAL = 60

    try:
        while True:
            current_time = time.time()
            if current_time - last_zone_fetch > ZONE_FETCH_INTERVAL or not zones:
                zones = ambil_zona_dari_db(id_kamera)
                last_zone_fetch = current_time

            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue

            # Process frame
            annotated = process_frame(frame, id_kamera, zones)
            
            # Encode
            success, encoded_image = cv2.imencode('.jpg', annotated)
            if not success:
                continue

            frame_bytes = encoded_image.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            await asyncio.sleep(0.03) # yield control to event loop (~30fps max)
    finally:
        cap.release()

@app.get("/kamera/{id_kamera}/stream")
async def get_stream(id_kamera: int):
    return StreamingResponse(frame_generator(id_kamera), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/kamera/{id_kamera}/snapshot")
def get_snapshot(id_kamera: int):
    ip_address = get_kamera_ip(id_kamera)
    cam_source = 0
    if ip_address:
        cam_source = int(ip_address) if ip_address.isdigit() else ip_address
        
    cap = cv2.VideoCapture(cam_source)
    if not cap.isOpened():
        raise HTTPException(status_code=503, detail="Kamera tidak dapat diakses")
    
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=503, detail="Cannot capture frame")

    zones = ambil_zona_dari_db(id_kamera)
    annotated = process_frame(frame, id_kamera, zones)
    
    success, encoded_image = cv2.imencode('.jpg', annotated)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode image")
    
    return StreamingResponse(io.BytesIO(encoded_image.tobytes()), media_type="image/jpeg")
