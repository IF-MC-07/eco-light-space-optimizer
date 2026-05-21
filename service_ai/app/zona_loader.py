import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

def get_db_connection():
    db_type = os.environ.get('DB_TYPE', 'local')
    if db_type == 'supabase' and os.environ.get('SUPABASE_DATABASE_URL'):
        return psycopg2.connect(os.environ.get('SUPABASE_DATABASE_URL'))
    
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'root'),
        dbname=os.environ.get('DB_NAME', 'eco-light'),
        port=os.environ.get('DB_PORT', '5432')
    )

def ambil_zona_dari_db(camera_id: str) -> list[dict]:
    """
    Mengambil data zona dari database berdasarkan camera_id.
    Standardized to match Sequelize schema (zones, cameras, room_id, camera_id, etc.)
    """
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Failed to establish database connection.")
            return []
            
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Explicitly select columns to match Sequelize model
            cur.execute("""
                SELECT 
                    zone_id, room_id, zone_name, zone_status, 
                    x1_pct, y1_pct, x2_pct, y2_pct, 
                    color, sort_order,
                    COALESCE(skew_x, 0) as skew_x,
                    COALESCE(skew_y, 0) as skew_y
                FROM zones 
                WHERE room_id = (
                    SELECT room_id FROM cameras WHERE camera_id = %s
                )
                AND zone_status = 'active'
                ORDER BY sort_order
            """, (camera_id,))
            rows = cur.fetchall()
            
            if not rows:
                print(f"⚠️ No active zones found for camera_id: {camera_id}")
                return []
                
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"❌ Error fetching zones from DB: {e}")
        return []
    finally:
        if 'conn' in locals() and conn and not conn.closed:
            conn.close()

def titik_di_zona(cx_rel: float, cy_rel: float, zona: dict) -> bool:
    x1 = float(zona.get('x1_pct', 0))
    y1 = float(zona.get('y1_pct', 0))
    x2 = float(zona.get('x2_pct', 0))
    y2 = float(zona.get('y2_pct', 0))
    
    # Ensure correctly ordered
    min_x = min(x1, x2)
    max_x = max(x1, x2)
    min_y = min(y1, y2)
    max_y = max(y1, y2)
    
    return (min_x <= cx_rel <= max_x) and (min_y <= cy_rel <= max_y)
