import json
import logging
from app.mqtt_subscriber import mqtt_client

logger = logging.getLogger(__name__)

def publish_inference_result(results: list, camera_id: str = "cam_01"):
    """Publish hasil deteksi YOLOv8 ke MQTT"""
    payload = {
        "camera_id": camera_id,
        "detections": results,
        "count": len(results)
    }
    mqtt_client.publish("ai/inference/result", payload)
    logger.info(f"✅ Result published: {len(results)} detections")