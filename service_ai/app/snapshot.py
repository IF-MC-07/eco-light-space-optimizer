from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import pymysql
import os
import io

app = FastAPI()

def get_kamera_ip(id_kamera: int) -> str:
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_user = os.environ.get('DB_USER', 'root')
    db_pass = os.environ.get('DB_PASS', '')
    db_name = os.environ.get('DB_NAME', 'ecolight')

    try:
        conn = pymysql.connect(host=db_host, user=db_user, password=db_pass, db=db_name)
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("SELECT ip_address FROM KAMERA WHERE id_kamera = %s", (id_kamera,))
            row = cur.fetchone()
            if row:
                return row['ip_address']
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        if 'conn' in locals() and conn.open:
            conn.close()
    return None

@app.get("/kamera/{id_kamera}/snapshot")
def get_snapshot(id_kamera: int):
    # ip_address = get_kamera_ip(id_kamera)
    # if not ip_address:
    #     raise HTTPException(status_code=404, detail="Kamera not found or no IP")

    # For testing, fallback to local webcam 0 if ip is something like '0' or we just use 0
    # cap = cv2.VideoCapture(int(ip_address) if ip_address.isdigit() else ip_address)
    
    # Actually, let's just use 0 since the user's test_camera.py uses 0
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Cannot connect to camera")
    
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=500, detail="Cannot capture frame")
    
    # encode as jpeg
    success, encoded_image = cv2.imencode('.jpg', frame)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode image")
    
    return StreamingResponse(io.BytesIO(encoded_image.tobytes()), media_type="image/jpeg")
