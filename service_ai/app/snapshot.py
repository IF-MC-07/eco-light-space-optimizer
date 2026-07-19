"""
snapshot.py — FastAPI application for the Eco-Light AI service.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import cv2
import os
import io
import asyncio
import time
import logging
from app.zona_loader import ambil_zona_dari_db, titik_di_zona
from app.camera_loader import get_camera_stream_source
from app.inference_realtime import get_latest_frame

app = FastAPI()
logger = logging.getLogger(__name__)

import requests

API_URL = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY = os.getenv("CAMERA_SECRET_KEY")

def get_kamera_ip(camera_id: str) -> str:
    source = get_camera_stream_source(camera_id)
    if source:
        return source

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


@app.get("/kamera/{id_kamera}/stream")
async def get_stream(id_kamera: str):
    # Baca dari shared frame buffer yang diisi camera_worker — TIDAK buka VideoCapture sendiri
    async def preview_generator(camera_id: str):
        try:
            while True:
                data = get_latest_frame(camera_id)

                if data is None or (time.time() - data["timestamp"]) > 5.0:
                    # buffer kosong atau basi (kamera worker gagal baca) — jangan tampilkan freeze diam-diam
                    await asyncio.sleep(0.3)
                    continue

                annotated = data["annotated"]
                success, encoded_image = cv2.imencode('.jpg', annotated)
                if not success:
                    await asyncio.sleep(0.03)
                    continue

                frame_bytes = encoded_image.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

                await asyncio.sleep(0.03)
        except asyncio.CancelledError:
            raise

    return StreamingResponse(preview_generator(id_kamera), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/kamera/{id_kamera}/snapshot")
def get_snapshot(id_kamera: str):
    data = get_latest_frame(id_kamera)
    if data is None:
        raise HTTPException(status_code=503, detail="Belum ada frame tersedia dari kamera")

    success, encoded_image = cv2.imencode('.jpg', data["annotated"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode image")

    return StreamingResponse(io.BytesIO(encoded_image.tobytes()), media_type="image/jpeg")


# Fallback take_snapshot function to satisfy mqtt_subscriber.py imports
def take_snapshot():
    print("📸 take_snapshot trigger invoked!")


# --- STATISTICS AND ENERGY ENDPOINTS ---
from app.statistics_engine import (
    get_realtime_stats, get_top_consumers, detect_usage_alerts,
    get_energy_summary, get_savings_breakdown, get_savings_trend,
    get_yoy_comparison, calculate_carbon_savings
)


@app.get("/stats/realtime")
async def get_realtime_stats_endpoint(room_id: Optional[str] = Query(default=None)):
    try:
        return get_realtime_stats(room_id=room_id)
    except Exception as e:
        logger.error(f"❌ /stats/realtime error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/top-consumers")
async def get_top_consumers_endpoint(limit: int = Query(default=5, ge=1, le=50)):
    try:
        return get_top_consumers(limit=limit)
    except Exception as e:
        logger.error(f"❌ /stats/top-consumers error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/alerts")
def api_usage_alerts(threshold: float = None):
    if threshold is None:
        threshold = float(os.getenv("ENERGY_THRESHOLD_WATTS", 500))
    return detect_usage_alerts(threshold)


@app.get("/energy/summary")
def api_energy_summary(room_id: str = None):
    summary = get_energy_summary(room_id)
    total_saved = summary.get("total_saved_watts", 0.0)
    carbon_cost = calculate_carbon_savings(total_saved)
    summary.update(carbon_cost)
    return summary


@app.get("/energy/breakdown")
def api_energy_breakdown(room_id: str = None):
    return get_savings_breakdown(room_id)


@app.get("/energy/trend")
def api_energy_trend(days: int = 7):
    return get_savings_trend(days)


@app.get("/energy/yoy")
def api_energy_yoy():
    return get_yoy_comparison()