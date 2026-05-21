import time
import logging

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

log = logging.getLogger(__name__)

def wait_for_db(max_retries=20, interval=3):
    """
    Try connecting to PostgreSQL every `interval` seconds.
    Raise RuntimeError if max_retries exceeded.
    Log each attempt.
    """
    for attempt in range(1, max_retries + 1):
        try:
            conn = get_db_connection()
            conn.close()
            log.info(f"✅ PostgreSQL ready (attempt {attempt})")
            return True
        except Exception as e:
            log.warning(f"⏳ DB not ready (attempt {attempt}/{max_retries}): {e}")
            time.sleep(interval)
    raise RuntimeError("❌ PostgreSQL not available after max retries. Aborting.")

def wait_for_mqtt(host, port, max_retries=20, interval=3):
    """
    Try TCP socket connection to MQTT broker every `interval` seconds.
    Raise RuntimeError if max_retries exceeded.
    """
    import socket
    for attempt in range(1, max_retries + 1):
        try:
            sock = socket.create_connection((host, port), timeout=2)
            sock.close()
            log.info(f"✅ MQTT broker ready (attempt {attempt})")
            return True
        except Exception as e:
            log.warning(f"⏳ MQTT not ready (attempt {attempt}/{max_retries}): {e}")
            time.sleep(interval)
    raise RuntimeError("❌ MQTT broker not available after max retries. Aborting.")
