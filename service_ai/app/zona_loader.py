import pymysql
import os

def ambil_zona_dari_db(id_kamera: int) -> list[dict]:
    # Use environment variables if available, fallback to defaults
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_user = os.environ.get('DB_USER', 'root')
    db_pass = os.environ.get('DB_PASS', '') # Assuming empty or specific in ecolight
    db_name = os.environ.get('DB_NAME', 'ecolight')

    try:
        conn = pymysql.connect(host=db_host, user=db_user, password=db_pass, db=db_name)
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("""
                SELECT * FROM ZONA 
                WHERE id_ruangan = (
                    SELECT id_ruangan FROM KAMERA WHERE id_kamera = %s
                )
                AND status_zona = 'aktif'
                ORDER BY urutan
            """, (id_kamera,))
            return cur.fetchall()
    except Exception as e:
        print(f"Error fetching zones: {e}")
        return []
    finally:
        if 'conn' in locals() and conn.open:
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
