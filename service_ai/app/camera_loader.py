import base64
import hashlib
import logging
import os
import psycopg2.extras

logger = logging.getLogger(__name__)

_CRYPTO_AVAILABLE = True
try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
except ImportError:
    _CRYPTO_AVAILABLE = False
    logger.warning("cryptography package not installed. Camera URL decryption from DB will be disabled.")

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection


def decrypt_camera_url(text: str) -> str:
    if not text:
        return text

    text = text.strip()
    parts = text.split(':')
    if len(parts) != 2 or len(parts[0]) != 32:
        return text

    if not _CRYPTO_AVAILABLE:
        logger.warning("cryptography unavailable, returning raw camera URL from DB.")
        return text

    try:
        iv = bytes.fromhex(parts[0])
        encrypted_text = bytes.fromhex(parts[1])
        secret = os.environ.get('CAMERA_SECRET_KEY', '')
        base64_key = base64.b64encode(hashlib.sha256(str(secret).encode()).digest()).decode()
        key = base64_key[:32].encode()

        decrypted_padded = decryptor.update(encrypted_text) + decryptor.finalize()
        unpadder = padding.PKCS7(128).unpadder()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()
        return decrypted.decode('utf-8').strip()
    except Exception as e:
        logger.error(f"❌ Error decrypting camera URL: {e}")
        return text


def get_camera_stream_source(camera_id: str) -> str | None:
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT ip_address, status FROM cameras WHERE camera_id = %s LIMIT 1",
                (camera_id,),
            )
            row = cur.fetchone()
            if not row:
                return None

            status = row.get('status')
            if status not in ('aktif', 'active'):
                return None

            ip_address = row.get('ip_address')
            result = decrypt_camera_url(ip_address) if ip_address else None
            return result.strip() if isinstance(result, str) else result
    except Exception as e:
        logger.error(f"❌ Failed to load camera stream source from DB: {e}")
        return None
    finally:
        if conn:
            release_connection(conn)


def get_active_camera_sources() -> list[dict]:
    conn = None
    cameras = []
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                "SELECT camera_id, ip_address FROM cameras WHERE status IN ('aktif', 'active') AND ip_address IS NOT NULL AND ip_address <> ''",
            )
            rows = cur.fetchall()
            for row in rows:
                ip = decrypt_camera_url(row['ip_address']) if row['ip_address'] else None
                if isinstance(ip, str):
                    ip = ip.strip()
                cameras.append({
                    'camera_id': row['camera_id'],
                    'ip_address': ip,
                })
            logger.info(f"DEBUG camera data: {cameras}")
    except Exception as e:
        logger.error(f"❌ Failed to load active camera sources from DB: {e}")
    finally:
        if conn:
            release_connection(conn)
    return [cam for cam in cameras if cam['ip_address']]
