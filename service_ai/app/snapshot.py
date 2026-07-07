"""
snapshot.py — FastAPI application for the Eco-Light AI service.

This module serves two purposes:
  1. Camera snapshot / inference preview endpoints (original purpose)
  2. Statistics & energy API endpoints (added to fix the empty dashboard)

Statistics endpoints expected by the Node.js server (energy.controller.js,
savings.controller.js):
  GET /energy/summary        → total consumption + savings overview
  GET /energy/trend          → daily savings trend (last N days)
  GET /energy/breakdown      → per-room savings breakdown
  GET /energy/yoy            → year-over-year comparison
  GET /stats/realtime        → real-time power sensor statistics
  GET /energy/{room_id}/latest → latest raw PZEM reading for a room
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import os
import io
import asyncio
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Eco-Light AI Service",
    description="Energy monitoring, statistics, and computer-vision inference.",
    version="2.0.0"
)

# CORS — allow Node.js server to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to server origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Camera / model setup (original snapshot functionality)
# ---------------------------------------------------------------------------
try:
    from ultralytics import YOLO
    MODEL_PATH = os.getenv('MODEL_PATH', 'yolov8n.pt')
    model = YOLO(MODEL_PATH)
except Exception as e:
    logger.warning(f"⚠️ Could not load YOLO model: {e}. Camera endpoints will not work.")
    model = None

import requests

API_URL = os.getenv("API_URL", "http://localhost:5000/api")
CAMERA_SECRET_KEY = os.getenv("CAMERA_SECRET_KEY")

try:
    from app.zona_loader import ambil_zona_dari_db, titik_di_zona
    from app.camera_loader import get_camera_stream_source
except ImportError:
    from zona_loader import ambil_zona_dari_db, titik_di_zona
    from camera_loader import get_camera_stream_source


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


async def read_frame_async(cap, timeout_secs=5.0):
    try:
        return await asyncio.wait_for(asyncio.to_thread(cap.read), timeout=timeout_secs)
    except asyncio.TimeoutError:
        return False, None


def process_frame(frame, id_kamera, zones):
    if model is None:
        return frame
    height, width = frame.shape[:2]
    results = model.predict(frame, conf=0.20, classes=[0], verbose=False)
    annotated = results[0].plot()

    count = {z['zone_name']: 0 for z in zones}
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx_rel = ((x1 + x2) // 2) / width
        cy_rel = ((y1 + y2) // 2) / height
        for z in zones:
            if titik_di_zona(cx_rel, cy_rel, z):
                count[z['zone_name']] += 1
                break

    for z in zones:
        zx1, zy1 = int(z['x1_pct'] * width), int(z['y1_pct'] * height)
        zx2, zy2 = int(z['x2_pct'] * width), int(z['y2_pct'] * height)
        hex_color = z['color'].lstrip('#')
        try:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            color = (b, g, r)
        except Exception:
            color = (0, 255, 0)
        cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), color, 2)
        cv2.putText(annotated, f"{z['zone_name']} | Orang: {count[z['zone_name']]}",
                    (zx1, zy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return annotated


# Fallback take_snapshot function
def take_snapshot():
    print("📸 take_snapshot trigger invoked!")


# ===========================================================================
# ENERGY & STATISTICS API ENDPOINTS
# ===========================================================================

def _get_stats_module():
    """Lazy-import statistics_engine to avoid circular imports."""
    try:
        import app.statistics_engine as se
        return se
    except ImportError:
        import statistics_engine as se
        return se


@app.get("/energy/summary")
async def get_energy_summary(room_id: Optional[str] = Query(default=None)):
    """
    Returns energy consumption and savings summary.
    Called by: Node.js energy.controller.js → getSummary()
    """
    try:
        se = _get_stats_module()
        summary = se.get_energy_summary(room_id=room_id)
        carbon  = se.calculate_carbon_savings(summary.get("total_saved_watts", 0.0))
        return {
            **summary,
            **carbon
        }
    except Exception as e:
        logger.error(f"❌ /energy/summary error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/energy/trend")
async def get_energy_trend(days: int = Query(default=7, ge=1, le=365)):
    """
    Returns daily savings trend for the last N days.
    Called by: Node.js energy.controller.js → getLogs()
               Node.js savings.controller.js → getTrend()
    """
    try:
        se = _get_stats_module()
        return se.get_savings_trend(days=days)
    except Exception as e:
        logger.error(f"❌ /energy/trend error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/energy/breakdown")
async def get_energy_breakdown(room_id: Optional[str] = Query(default=None)):
    """
    Returns per-room energy savings breakdown.
    Called by: Node.js energy.controller.js → getBreakdown()
               Node.js savings.controller.js → getBreakdown()
    """
    try:
        se = _get_stats_module()
        return se.get_savings_breakdown(room_id=room_id)
    except Exception as e:
        logger.error(f"❌ /energy/breakdown error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/energy/yoy")
async def get_energy_yoy():
    """
    Returns year-over-year energy comparison.
    Called by: Node.js savings.controller.js → getYoY()
    """
    try:
        se = _get_stats_module()
        return se.get_yoy_comparison()
    except Exception as e:
        logger.error(f"❌ /energy/yoy error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/realtime")
async def get_realtime_stats_endpoint(room_id: Optional[str] = Query(default=None)):
    """
    Returns real-time descriptive statistics from power_sensors table.
    Called by: Node.js energy.controller.js → getSummary() (for current_consumption)
    """
    try:
        se = _get_stats_module()
        return se.get_realtime_stats(room_id=room_id)
    except Exception as e:
        logger.error(f"❌ /stats/realtime error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/top-consumers")
async def get_top_consumers_endpoint(limit: int = Query(default=5, ge=1, le=50)):
    """
    Returns the top N rooms ranked by average power consumption.
    """
    try:
        se = _get_stats_module()
        return se.get_top_consumers(limit=limit)
    except Exception as e:
        logger.error(f"❌ /stats/top-consumers error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/alerts")
async def get_usage_alerts_endpoint(threshold_watts: float = Query(default=500.0)):
    """
    Returns rooms exceeding the power threshold.
    """
    try:
        se = _get_stats_module()
        return se.detect_usage_alerts(threshold_watts=threshold_watts)
    except Exception as e:
        logger.error(f"❌ /stats/alerts error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/energy/{room_id}/latest")
async def get_latest_energy(room_id: str):
    """
    Returns the most recent raw PZEM reading for a given room.
    Reads from power_sensors table via psycopg2.
    """
    try:
        from app.zona_loader import get_db_connection, release_connection
    except ImportError:
        from zona_loader import get_db_connection, release_connection

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT sensor_id, room_id, voltage_v, current_a, power_watts, read_at
                FROM power_sensors
                WHERE room_id = %s
                ORDER BY read_at DESC
                LIMIT 1
            """, (room_id,))
            row = cur.fetchone()

        if row:
            return {
                "success": True,
                "room_id": room_id,
                "sensor_id": row[0],
                "voltage": row[2],
                "current": row[3],
                "power": row[4],
                "timestamp": row[5].isoformat() if row[5] else None
            }
        return {"success": False, "message": f"No PZEM data found for room {room_id}"}

    except Exception as e:
        logger.error(f"❌ /energy/{{room_id}}/latest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            try:
                from app.zona_loader import release_connection
            except ImportError:
                from zona_loader import release_connection
            release_connection(conn)


@app.get("/health")
async def health_check():
    """Service health check endpoint."""
    return {"status": "ok", "service": "eco-light-ai"}