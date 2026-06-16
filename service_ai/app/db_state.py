import logging

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from app.zona_loader import get_db_connection

logger = logging.getLogger(__name__)

def ensure_device_states_exist():
    """
    Ensure light_controls and ac_controls always have a row 
    for every device. Prevents NULL state issues during recovery.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # For every iot_device of type 'light'
            logger.info("Ensuring light controls exist in DB...")
            cur.execute("""
                INSERT INTO light_controls (control_id, zone_id, device_id, relay_channel, light_status, updated_at)
                SELECT 'LGT' || substring(md5(d.device_id), 1, 15), z.zone_id, d.device_id, 1, 'OFF', NOW()
                FROM iot_devices d
                JOIN zones z ON d.room_id = z.room_id
                WHERE d.type = 'light'
                ON CONFLICT (control_id) DO NOTHING;
            """)
            
            # For every iot_device of type 'ac'
            logger.info("Ensuring AC controls exist in DB...")
            cur.execute("""
                INSERT INTO ac_controls (ac_control_id, room_id, device_id, temperature_setting, ac_status, updated_at)
                SELECT 'ACC' || substring(md5(d.device_id), 1, 15), d.room_id, d.device_id, 22.0, 'OFF', NOW()
                FROM iot_devices d
                WHERE d.type = 'ac'
                ON CONFLICT (ac_control_id) DO NOTHING;
            """)
            conn.commit()
            logger.info("✅ Device states successfully ensured in DB.")
    except Exception as e:
        logger.error(f"❌ Error ensuring device states exist: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)
