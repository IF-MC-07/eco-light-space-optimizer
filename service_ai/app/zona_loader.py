import psycopg2
import psycopg2.extras
import psycopg2.pool
import os
import time
import logging
import threading
from dotenv import load_dotenv

# Load env variables
load_dotenv()
logger = logging.getLogger(__name__)

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        url = os.environ.get("SUPABASE_DATABASE_URL")
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=url,
            sslmode='require'
        )
    return _pool

def get_db_connection():
    return get_pool().getconn()

def release_connection(conn, close=False):
    if conn:
        try:
            get_pool().putconn(conn, close=close)
        except Exception as e:
            logger.warning(f"⚠️ Failed to return connection to pool: {e}")

class ZoneManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ZoneManager, cls).__new__(cls)
                cls._instance._init_manager()
            return cls._instance

    def _init_manager(self):
        self.cache = {}
        self.ttl = int(os.getenv("ZONE_CACHE_TTL", 300))
        self._cache_lock = threading.Lock()

    def get_zones(self, camera_id: str) -> list[dict]:
        now = time.time()
        
        # Check cache
        with self._cache_lock:
            cached_data = self.cache.get(camera_id)
            if cached_data:
                cached_zones, timestamp = cached_data
                if now - timestamp < self.ttl:
                    return cached_zones
        
        # Fetch from DB
        conn = None
        try:
            conn = get_db_connection()
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT
                        zone_id,
                        room_id,
                        zone_name,
                        zone_status,
                        x1_pct,
                        y1_pct,
                        x2_pct,
                        y2_pct,
                        color,
                        sort_order,
                        COALESCE(skew_x,0) as skew_x,
                        COALESCE(skew_y,0) as skew_y
                    FROM zones
                    WHERE room_id = (
                        SELECT room_id
                        FROM cameras
                        WHERE camera_id = %s
                    )
                    AND zone_status IN ('active','aktif')
                    ORDER BY sort_order
                """, (camera_id,))
                rows = cur.fetchall()
                zones = [dict(row) for row in rows] if rows else []
                
                # Update cache
                with self._cache_lock:
                    self.cache[camera_id] = (zones, now)
                
                return zones
        except Exception as e:
            logger.error(f"❌ Error fetching zones from DB: {e}")
            # Fallback to cache
            with self._cache_lock:
                if cached_data:
                    logger.warning(f"⚠️ Returning stale cache for camera {camera_id} due to DB error.")
                    return cached_data[0]
            return []
        finally:
            if conn:
                close_conn = False
                try:
                    if conn.closed != 0:
                        close_conn = True
                except Exception:
                    close_conn = True
                release_connection(conn, close=close_conn)

def ambil_zona_dari_db(camera_id: str) -> list[dict]:
    return ZoneManager().get_zones(camera_id)

def titik_di_zona(cx_rel: float, cy_rel: float, zona: dict) -> bool:
    x1 = float(zona.get('x1_pct', 0))
    y1 = float(zona.get('y1_pct', 0))
    x2 = float(zona.get('x2_pct', 0))
    y2 = float(zona.get('y2_pct', 0))
    skew_x = float(zona.get('skew_x', 0))
    skew_y = float(zona.get('skew_y', 0))
    
    min_x, max_x = min(x1, x2), max(x1, x2)
    min_y, max_y = min(y1, y2), max(y1, y2)
    
    # Construct 4-point polygon with skew applied
    p1 = (min_x + skew_x, min_y + skew_y)
    p2 = (max_x + skew_x, min_y - skew_y)
    p3 = (max_x - skew_x, max_y - skew_y)
    p4 = (min_x - skew_x, max_y + skew_y)
    
    polygon = [p1, p2, p3, p4]
    
    # Ray-Casting Algorithm
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if min(p1y, p2y) < cy_rel <= max(p1y, p2y):
            if cx_rel <= max(p1x, p2x):
                if p1y != p2y:
                    xints = (cy_rel - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or cx_rel <= xints:
                    inside = not inside
        p1x, p1y = p2x, p2y

    return inside
