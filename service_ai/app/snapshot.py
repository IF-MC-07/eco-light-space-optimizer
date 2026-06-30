from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import os
import io
import asyncio
import time

try:
    from app.inference_realtime import get_latest_frame
except ImportError:
    from inference_realtime import get_latest_frame

app = FastAPI()

# ─── Fallback bila buffer belum terisi (mis. baru startup) ───────────────────
WAIT_FOR_FIRST_FRAME_TIMEOUT = float(os.getenv("WAIT_FOR_FIRST_FRAME_TIMEOUT", 8.0))
STREAM_POLL_INTERVAL = float(os.getenv("STREAM_POLL_INTERVAL", 0.3))


async def _wait_first_frame(camera_id: str, timeout: float = WAIT_FOR_FIRST_FRAME_TIMEOUT):
    start = time.time()
    while time.time() - start < timeout:
        data = get_latest_frame(camera_id)
        if data is not None:
            return data
        await asyncio.sleep(0.2)
    return None


# snapshot.py — tambahkan query param annotate
@app.get("/kamera/{id_kamera}/stream")
async def get_stream(id_kamera: str, annotate: bool = True):
    async def preview_generator(camera_id: str):
        last_timestamp = None
        first = await _wait_first_frame(camera_id)
        if first is None:
            raise HTTPException(status_code=503, detail="Belum ada frame dari worker")

        while True:
            data = get_latest_frame(camera_id)
            if data is None or data["timestamp"] == last_timestamp:
                await asyncio.sleep(STREAM_POLL_INTERVAL)
                continue
            last_timestamp = data["timestamp"]

            img = data["annotated"] if annotate else data["frame"]
            success, encoded_image = cv2.imencode('.jpg', img)
            if not success:
                await asyncio.sleep(STREAM_POLL_INTERVAL)
                continue

            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + encoded_image.tobytes() + b'\r\n')
            await asyncio.sleep(STREAM_POLL_INTERVAL)

    return StreamingResponse(preview_generator(id_kamera), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/kamera/{id_kamera}/snapshot")
async def get_snapshot(id_kamera: str):
    data = await _wait_first_frame(id_kamera)
    if data is None:
        raise HTTPException(status_code=503, detail="Belum ada frame dari worker, kamera mungkin belum aktif")

    success, encoded_image = cv2.imencode('.jpg', data["annotated"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode image")

    return StreamingResponse(io.BytesIO(encoded_image.tobytes()), media_type="image/jpeg")


# Fallback take_snapshot function to satisfy mqtt_subscriber.py imports
def take_snapshot():
    print("📸 take_snapshot trigger invoked!")


# --- STATISTICS AND ENERGY ENDPOINTS (tidak berubah) ---
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