import os
import time
import logging
import threading

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection

logger = logging.getLogger(__name__)

_cache = {}
_cache_lock = threading.Lock()
_last_warn_time = {}

def get_guard_ttl() -> float:
    try:
        return float(os.getenv("DSLB_GUARD_CACHE_SECONDS", "30"))
    except ValueError:
        return 30.0

def clear_guard_cache():
    """Clear in-memory cache for testing."""
    with _cache_lock:
        _cache.clear()
        _last_warn_time.clear()

def is_simulated_room(room_id: str) -> bool:
    """
    Check if a room is marked as simulated.
    Returns True if room is simulated, False if physical/unknown/DB error.
    Caches result for DSLB_GUARD_CACHE_SECONDS (default 30s).
    """
    if not room_id:
        return False

    now = time.time()
    ttl = get_guard_ttl()

    with _cache_lock:
        if room_id in _cache:
            is_sim, exp = _cache[room_id]
            if now < exp:
                return is_sim

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT is_simulated FROM rooms WHERE room_id = %s LIMIT 1", (room_id,))
            row = cur.fetchone()

        if row is None:
            _log_warning_ratelimited(room_id, f"Room '{room_id}' not found in rooms table; treating as non-simulated.")
            val = False
        else:
            val = bool(row[0])

        with _cache_lock:
            _cache[room_id] = (val, now + ttl)
        return val

    except Exception as e:
        _log_warning_ratelimited(room_id, f"DB error checking simulation status for room '{room_id}': {e}")
        return False
    finally:
        if conn:
            try:
                release_connection(conn, close=False)
            except Exception:
                pass

def _log_warning_ratelimited(key: str, message: str, min_interval: float = 60.0):
    now = time.time()
    with _cache_lock:
        last = _last_warn_time.get(key, 0.0)
        if now - last >= min_interval:
            _last_warn_time[key] = now
            logger.warning(f"⚠️ [DSLB Guard] {message}")

