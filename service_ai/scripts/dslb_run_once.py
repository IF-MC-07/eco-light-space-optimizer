"""One-shot DSLB cycle runner against test database (schema_test).

Runs a single DSLB cycle using the live repository and current store readings,
without starting MQTT, camera workers, or background threads.
"""

import os
import sys
import time

# Ensure service_ai is in python path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_AI_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if SERVICE_AI_DIR not in sys.path:
    sys.path.insert(0, SERVICE_AI_DIR)

from dotenv import load_dotenv

# Load service_ai .env
env_path = os.path.join(SERVICE_AI_DIR, ".env")
load_dotenv(env_path)

from app.dslb_config import DslbConfig
from app.dslb_engine import run_cycle
from app.dslb_repository import DslbRepository
from app.occupancy_store import store
from app.zona_loader import get_db_connection, release_connection


def main():
    print("=== DSLB One-Shot Runner ===")

    # 1. Verify connection and current user/schema
    conn = get_db_connection()
    try:
        host = conn.info.host
        port = conn.info.port
        print(f"Database Host: {host}:{port}")

        with conn.cursor() as cur:
            cur.execute("SELECT current_user, current_schema();")
            current_user, current_schema = cur.fetchone()
            print(f"Current User:   {current_user}")
            print(f"Current Schema: {current_schema}")

            if current_user != "dslb_test" or current_schema != "schema_test":
                print("[ERROR] Connection must be role 'dslb_test' and schema 'schema_test'. Aborting.")
                sys.exit(1)
            print("[OK] Verified target test schema and role.")
    finally:
        release_connection(conn)

    # 2. Run single cycle
    cfg = DslbConfig.from_env()
    repo = DslbRepository()
    state = {}
    now_mono = time.monotonic()

    print(f"\nExecuting single DSLB cycle (DSLB_ENABLED={cfg.enabled})...")
    snapshots = run_cycle(repo, store, state, cfg, now_mono)
    print(f"Processed {len(snapshots)} room(s).")

    # 3. Print current contents of room_occupancy_current table
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    occ_id,
                    room_id,
                    confirmed_status,
                    candidate_status,
                    candidate_count,
                    person_count,
                    capacity,
                    occupancy_pct_raw,
                    available_seats,
                    is_stale,
                    updated_at,
                    recommendations
                FROM room_occupancy_current
                ORDER BY room_id ASC;
                """
            )
            rows = cur.fetchall()
            print("\n=== Current room_occupancy_current Table ===")
            if not rows:
                print("(Table is currently empty)")
            else:
                for r in rows:
                    print(
                        f"- Room [{r[1]}]: Status={r[2]} (Cand: {r[3]} x{r[4]}), "
                        f"Count={r[5]}/{r[6]} ({r[7]}%), Seats={r[8]}, "
                        f"Stale={r[9]}, Updated={r[10]}"
                    )
                    if r[11]:
                        print(f"  Recos: {r[11]}")
    finally:
        release_connection(conn)

    print("\n[OK] DSLB one-shot run complete.")


if __name__ == "__main__":
    main()
