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
MODEL_PATH = os.getenv('MODEL_PATH', 'yolov8n.pt')
model = YOLO(MODEL_PATH)

import requests

API_URL = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY = os.getenv("CAMERA_SECRET_KEY")

def get_kamera_ip(camera_id: str) -> str:
    if not CAMERA_SECRET_KEY:
        print("❌ CAMERA_SECRET_KEY tidak diatur!")
        return None
        
    try:
        headers = {"x-ai-secret": CAMERA_SECRET_KEY}
        response = requests.get(f"{API_URL}/cameras/ai/stream-urls", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                cameras = data.get("data", [])
                for cam in cameras:
                    if cam["camera_id"] == camera_id:
                        return cam["ip_address"]
    except Exception as e:
        print(f"API Error fetching camera IP: {e}")
    return None

def process_frame(frame, id_kamera, zones):
    height, width = frame.shape[:2]

    # Run YOLO
    results = model.predict(
        frame,  
        conf=0.20,
        classes=[0],
        verbose=False
    )
    
    # Plot YOLO results (bounding boxes)
    annotated = results[0].plot()

    # Calculate counts
    count = {z['zone_name']: 0 for z in zones}
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx_rel = ((x1 + x2) // 2) / width
        cy_rel = ((y1 + y2) // 2) / height
        
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z['zone_name']] += 1
                break

    # Draw zones
    for z in zones:
        zx1, zy1 = int(z['x1_pct'] * width), int(z['y1_pct'] * height)
        zx2, zy2 = int(z['x2_pct'] * width), int(z['y2_pct'] * height)
        # Parse hex color safely
        hex_color = z['color'].lstrip('#')
        try:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            color = (b, g, r) # OpenCV uses BGR
        except:
            color = (0, 255, 0)
            
        cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), color, 2)
        cv2.putText(annotated, f"{z['zone_name']} | Orang: {count[z['zone_name']]}", 
                    (zx1, zy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return annotated

async def frame_generator(id_kamera: str):
    ip_address = get_kamera_ip(id_kamera)
    if not ip_address:
        raise HTTPException(status_code=404, detail="Camera IP not found")
        
    cam_source = int(ip_address) if ip_address.isdigit() else ip_address
            
    if isinstance(cam_source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(cam_source, cv2.CAP_DSHOW)
    else:
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
async def get_stream(id_kamera: str):
    return StreamingResponse(frame_generator(id_kamera), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/kamera/{id_kamera}/snapshot")
def get_snapshot(id_kamera: str):
    ip_address = get_kamera_ip(id_kamera)
    if not ip_address:
        raise HTTPException(status_code=404, detail="Camera IP not found")
        
    cam_source = int(ip_address) if ip_address.isdigit() else ip_address
        
    if isinstance(cam_source, int) and os.name == 'nt':
        cap = cv2.VideoCapture(cam_source, cv2.CAP_DSHOW)
    else:
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


# Fallback take_snapshot function to satisfy mqtt_subscriber.py imports
def take_snapshot():
    print("📸 take_snapshot trigger invoked!")


# --- STATISTICS AND ENERGY ENDPOINTS ---
try:
    from app.statistics_engine import (
        get_realtime_stats, get_top_consumers, detect_usage_alerts,
        get_energy_summary, get_savings_breakdown, get_savings_trend,
        get_yoy_comparison, calculate_carbon_savings
    )
except ImportError:
    from statistics_engine import (
        get_realtime_stats, get_top_consumers, detect_usage_alerts,
        get_energy_summary, get_savings_breakdown, get_savings_trend,
        get_yoy_comparison, calculate_carbon_savings
    )


@app.get("/stats/realtime")
def api_realtime_stats(room_id: int = None):
    return get_realtime_stats(room_id)


@app.get("/stats/top-consumers")
def api_top_consumers(limit: int = 5):
    return get_top_consumers(limit)


@app.get("/stats/alerts")
def api_usage_alerts(threshold: float = None):
    if threshold is None:
        threshold = float(os.getenv("ENERGY_THRESHOLD_WATTS", 500))
    return detect_usage_alerts(threshold)


@app.get("/energy/summary")
def api_energy_summary(room_id: int = None):
    summary = get_energy_summary(room_id)
    # Also calculate carbon/cost savings based on total_saved_watts
    total_saved = summary.get("total_saved_watts", 0.0)
    carbon_cost = calculate_carbon_savings(total_saved)
    summary.update(carbon_cost)
    return summary


@app.get("/energy/breakdown")
def api_energy_breakdown(room_id: int = None):
    return get_savings_breakdown(room_id)


@app.get("/energy/trend")
def api_energy_trend(days: int = 7):
    return get_savings_trend(days)


@app.get("/energy/yoy")
def api_energy_yoy():
    return get_yoy_comparison()
