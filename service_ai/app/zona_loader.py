import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load env variables from ../server/.env if exists
env_path = os.path.join(os.path.dirname(__file__), '../../server/.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

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

def ambil_zona_dari_db(id_kamera: int) -> list[dict]:
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT * FROM zona 
                WHERE id_ruangan = (
                    SELECT id_ruangan FROM kamera WHERE id_kamera = %s
                )
                AND status_zona = 'aktif'
                ORDER BY urutan
            """, (id_kamera,))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching zones: {e}")
        return []
    finally:
        if 'conn' in locals() and not conn.closed:
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
