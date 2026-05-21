import logging
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from zona_loader import get_db_connection

load_dotenv()
logger = logging.getLogger(__name__)

def write_detection_logs(camera_id: str, occupancy_counts: dict):
    """
    Saves occupancy count per zone to detection_logs table using batch INSERT.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # 1. Fetch active zones for this camera's room to map names to zone_ids
            cur.execute("""
                SELECT zone_id, zone_name 
                FROM zones 
                WHERE room_id = (
                    SELECT room_id FROM cameras WHERE camera_id = %s
                )
                AND zone_status = 'aktif'
            """, (camera_id,))
            
            zone_rows = cur.fetchall()
            if not zone_rows:
                logger.warning(f"⚠️ No active zones found for camera_id {camera_id} while writing logs.")
                return

            # Map zone_name -> zone_id
            zone_mapping = {row[1]: row[0] for row in zone_rows}

            # 2. Build tuples list for batch insert
            insert_tuples = []
            for zone_name, count in occupancy_counts.items():
                # Skip helper keys that might be in occupancy_counts
                if zone_name in ["total", "luar_zona"]:
                    continue

                zone_id = zone_mapping.get(zone_name)
                if zone_id is None:
                    # If zone name is not mapped (e.g. newly added/modified zone not in cache)
                    # We skip it or log it
                    continue

                status = 'occupied' if count > 0 else 'empty'
                insert_tuples.append((
                    zone_id,
                    camera_id,
                    count,
                    status
                ))

            # 3. Perform batch insert using psycopg2.extras.execute_values
            if insert_tuples:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO detection_logs 
                      (zone_id, camera_id, occupancy_count, zone_status, detection_time)
                    VALUES %s
                    """,
                    insert_tuples,
                    template="(%s, %s, %s, %s, NOW())"
                )
                conn.commit()
                logger.info(f"📝 Batch inserted {len(insert_tuples)} detection logs for Camera {camera_id}.")

    except Exception as e:
        logger.error(f"❌ DB Error writing detection logs: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and not conn.closed:
            conn.close()
