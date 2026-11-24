"""Database repository for DSLB operations using the project connection pool."""

import json
import logging
import secrets
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.errors
import psycopg2.extras

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection

logger = logging.getLogger(__name__)

SPECIAL_STATUSES = {"Tidak tersedia", "Kapasitas belum dikonfigurasi"}


def generate_custom_id(prefix: str) -> str:
    """Generate ID matching pattern: PREFIX-8randomhex (e.g., OCC-a1b2c3d4)."""
    return f"{prefix.upper()}-{secrets.token_hex(4)}"


class DslbRepository:
    """Raw SQL repository for room occupancy, status history, and recommendation logs."""

    def __init__(self, get_conn_fn=get_db_connection, release_conn_fn=release_connection):
        self._get_conn = get_conn_fn
        self._release_conn = release_conn_fn

    def fetch_rooms(self) -> List[Dict[str, Any]]:
        """Fetch all ACTIVE rooms with DSLB-relevant columns."""
        conn = self._get_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute(
                    """
                    SELECT room_id, room_name, building, floor, capacity, is_simulated
                    FROM rooms
                    WHERE status = 'ACTIVE'
                    ORDER BY room_name ASC
                    """
                )
                rows = cur.fetchall()
                result = []
                for r in rows:
                    cap = r["capacity"]
                    if cap is not None and int(cap) <= 0:
                        cap = None
                    result.append(
                        {
                            "room_id": r["room_id"],
                            "room_name": r["room_name"],
                            "building": r["building"],
                            "floor": r["floor"],
                            "capacity": int(cap) if cap is not None else None,
                            "is_simulated": bool(r["is_simulated"]),
                        }
                    )
                return result
        finally:
            self._release_conn(conn)

    def fetch_active_camera_map(self) -> Dict[str, str]:
        """Fetch room_id -> camera_id mapping for active cameras.
        
        Status is compared case-insensitively against 'aktif' and 'active'.
        """
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT room_id, camera_id
                    FROM cameras
                    WHERE LOWER(status) IN ('aktif', 'active')
                      AND room_id IS NOT NULL
                    """
                )
                rows = cur.fetchall()
                return {row[0]: row[1] for row in rows}
        finally:
            self._release_conn(conn)

    def fetch_simulated_counts(self) -> Dict[str, Tuple[int, float]]:
        """Fetch room_id -> (person_count, age_seconds) for simulated rooms.
        
        Age is calculated in SQL using NOW() - updated_at to stay independent
        of process clock differences.
        """
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT room_id, person_count, EXTRACT(EPOCH FROM (NOW() - updated_at)) AS age_seconds
                    FROM simulated_room_counts
                    """
                )
                rows = cur.fetchall()
                result = {}
                for row in rows:
                    room_id = row[0]
                    count = int(row[1]) if row[1] is not None else 0
                    age = float(row[2]) if row[2] is not None else 0.0
                    result[room_id] = (count, max(0.0, age))
                return result
        finally:
            self._release_conn(conn)

    def upsert_current(self, row: Dict[str, Any]) -> None:
        """Upsert current occupancy status for a room in a single transaction."""
        conn = self._get_conn()
        try:
            status = row.get("confirmed_status", "Tidak tersedia")
            is_special = status in SPECIAL_STATUSES

            person_count = None if is_special else row.get("person_count")
            occupancy_pct_raw = None if is_special else row.get("occupancy_pct_raw")
            available_seats = None if is_special else row.get("available_seats")

            capacity = row.get("capacity")
            if capacity is not None and int(capacity) <= 0:
                capacity = None

            recommendations = row.get("recommendations", [])
            reco_json = json.dumps(recommendations)

            occ_id = row.get("occ_id") or generate_custom_id("OCC")

            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO room_occupancy_current (
                        occ_id, room_id, confirmed_status, candidate_status, candidate_count,
                        person_count, capacity, occupancy_pct_raw, available_seats,
                        recommendations, is_stale, updated_at
                    ) VALUES (
                        %(occ_id)s, %(room_id)s, %(confirmed_status)s, %(candidate_status)s, %(candidate_count)s,
                        %(person_count)s, %(capacity)s, %(occupancy_pct_raw)s, %(available_seats)s,
                        %(recommendations)s::jsonb, %(is_stale)s, NOW()
                    )
                    ON CONFLICT (room_id) DO UPDATE SET
                        confirmed_status  = EXCLUDED.confirmed_status,
                        candidate_status  = EXCLUDED.candidate_status,
                        candidate_count   = EXCLUDED.candidate_count,
                        person_count      = EXCLUDED.person_count,
                        capacity          = EXCLUDED.capacity,
                        occupancy_pct_raw = EXCLUDED.occupancy_pct_raw,
                        available_seats   = EXCLUDED.available_seats,
                        recommendations   = EXCLUDED.recommendations,
                        is_stale          = EXCLUDED.is_stale,
                        updated_at        = NOW();
                    """,
                    {
                        "occ_id": occ_id,
                        "room_id": row["room_id"],
                        "confirmed_status": status,
                        "candidate_status": row.get("candidate_status"),
                        "candidate_count": int(row.get("candidate_count", 0)),
                        "person_count": person_count,
                        "capacity": capacity,
                        "occupancy_pct_raw": occupancy_pct_raw,
                        "available_seats": available_seats,
                        "recommendations": reco_json,
                        "is_stale": bool(row.get("is_stale", False)),
                    },
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._release_conn(conn)

    def insert_history(
        self,
        room_id: str,
        status: str,
        person_count: Optional[int],
        occupancy_pct_raw: Optional[float],
        reason: str = "status_change",
    ) -> None:
        """Insert status transition or heartbeat record into room_occupancy_status."""
        conn = self._get_conn()
        try:
            is_special = status in SPECIAL_STATUSES
            final_count = None if is_special else person_count
            final_pct = None if is_special else occupancy_pct_raw
            history_id = generate_custom_id("HST")

            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO room_occupancy_status (
                        history_id, room_id, status, person_count, occupancy_pct_raw, reason, created_at
                    ) VALUES (
                        %(history_id)s, %(room_id)s, %(status)s, %(person_count)s, %(occupancy_pct_raw)s, %(reason)s, NOW()
                    )
                    """,
                    {
                        "history_id": history_id,
                        "room_id": room_id,
                        "status": status,
                        "person_count": final_count,
                        "occupancy_pct_raw": final_pct,
                        "reason": reason,
                    },
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._release_conn(conn)

    def insert_reco_log(self, room_id: str, recommendations: List[Dict[str, Any]]) -> None:
        """Insert recommendation log entry with ordered JSONB recommendations."""
        conn = self._get_conn()
        try:
            reco_log_id = generate_custom_id("REC")
            reco_json = json.dumps(recommendations)

            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO room_recommendations_log (
                        reco_log_id, room_id, recommendations, created_at
                    ) VALUES (
                        %(reco_log_id)s, %(room_id)s, %(recommendations)s::jsonb, NOW()
                    )
                    """,
                    {
                        "reco_log_id": reco_log_id,
                        "room_id": room_id,
                        "recommendations": reco_json,
                    },
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._release_conn(conn)

