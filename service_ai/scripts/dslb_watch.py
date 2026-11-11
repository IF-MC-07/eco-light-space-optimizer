#!/usr/bin/env python3
"""
DSLB Live Console Watcher.
Runs DslbEngine as a single-thread monitor on the real database,
evaluating simulated rooms and printing a formatted status table every cycle.
"""

import argparse
import json
import logging
import math
import os
import signal
import sys
import time
from datetime import datetime

# Setup paths so script can import app modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_AI_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
sys.path.insert(0, SERVICE_AI_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from app.dslb_config import DslbConfig
from app.dslb_engine import run_cycle
from app.dslb_repository import DslbRepository
from app.occupancy_store import OccupancyStore
from app.zona_loader import get_db_connection, release_connection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("dslb_watch")


def check_runtime_schema(conn, allow_public: bool = False):
    with conn.cursor() as cur:
        cur.execute("SELECT current_user, current_schema()")
        user, schema = cur.fetchone()

    dsn_params = conn.get_dsn_parameters() if hasattr(conn, "get_dsn_parameters") else {}
    host = dsn_params.get("host", "localhost")

    logger.info(f"Connected to DB — host: {host}, current_user: {user}, current_schema: {schema}")

    if user != "dslb_test" or schema != "schema_test":
        if not allow_public:
            raise RuntimeError(
                f"Refusing to run on host '{host}' with user '{user}' and schema '{schema}'. "
                "Expected user 'dslb_test' and schema 'schema_test'. "
                "Pass --allow-public if you explicitly intend to run on this database/schema."
            )
        else:
            logger.warning(f"⚠️ Running with user '{user}' and schema '{schema}' due to --allow-public.")


def fetch_and_print_table(conn, cycle_num: int):
    sql = """
        SELECT
            r.room_name,
            r.room_id,
            c.confirmed_status,
            c.person_count,
            r.capacity,
            c.occupancy_pct_raw,
            c.candidate_status,
            c.candidate_count,
            EXTRACT(EPOCH FROM (NOW() - COALESCE(s.updated_at, c.updated_at))) AS data_age,
            c.recommendations,
            ros.reason AS last_status_reason
        FROM rooms r
        LEFT JOIN room_occupancy_current c ON r.room_id = c.room_id
        LEFT JOIN simulated_room_counts s ON r.room_id = s.room_id
        LEFT JOIN LATERAL (
            SELECT reason FROM room_occupancy_status
            WHERE room_id = r.room_id
            ORDER BY created_at DESC
            LIMIT 1
        ) ros ON true
        WHERE r.is_simulated = true
        ORDER BY r.room_name;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("\n" + "=" * 115)
    print(f"DSLB OCCUPANCY MONITOR — SIKLUS #{cycle_num} [{now_str}]")
    print("=" * 115)
    header = f"{'Ruangan':<12} | {'Status':<16} | {'Orang/Kap':<11} | {'Okupansi %':<10} | {'Kandidat (Hit)':<16} | {'Usia Data':<10} | {'Rekomendasi':<32}"
    print(header)
    print("-" * 115)

    if not rows:
        print("  (Tidak ada ruangan simulasi aktif ditemukan dengan is_simulated = true)")
        print("=" * 115 + "\n")
        return

    for row in rows:
        room_name = row[0] or row[1]
        status = row[2] or "-"
        person_cnt = row[3]
        capacity = row[4]
        raw_pct = row[5]
        cand_status = row[6]
        cand_count = row[7] or 0
        data_age = row[8]
        recos_data = row[9]

        # Formatting count / capacity
        if person_cnt is not None and capacity is not None:
            count_cap = f"{person_cnt}/{capacity}"
        elif person_cnt is not None:
            count_cap = f"{person_cnt}/?"
        else:
            count_cap = "-"

        # Formatting occupancy percentage (display floor)
        if raw_pct is not None:
            disp_pct = min(100.0, math.floor(raw_pct * 10) / 10)
            pct_str = f"{disp_pct:.1f}%"
        else:
            pct_str = "-"

        # Candidate status & count
        if cand_status and cand_count > 0:
            cand_str = f"{cand_status} ({cand_count})"
        else:
            cand_str = "-"

        # Data age
        if data_age is not None:
            age_str = f"{data_age:.1f}s"
        else:
            age_str = "-"

        # Recommendations
        if recos_data:
            if isinstance(recos_data, str):
                try:
                    recos_data = json.loads(recos_data)
                except Exception:
                    recos_data = []
            reco_list = []
            for r in recos_data:
                r_name = r.get("room_name") or r.get("room_id")
                r_pct = r.get("occupancy_pct")
                if r_pct is not None:
                    reco_list.append(f"{r_name} ({r_pct:.0f}%)")
                else:
                    reco_list.append(r_name)
            recos_str = ", ".join(reco_list) if reco_list else "None"
        else:
            recos_str = "-"

        line = f"{room_name:<12} | {status:<16} | {count_cap:<11} | {pct_str:<10} | {cand_str:<16} | {age_str:<10} | {recos_str:<32}"
        print(line)

    print("=" * 115 + "\n")


def main():
    parser = argparse.ArgumentParser(description="DSLB Real-time Engine Console Watcher")
    parser.add_argument(
        "--cycle-seconds",
        type=float,
        default=None,
        help="Override DSLB cycle interval in seconds (default: 15s or DSLB_CYCLE_SECONDS)",
    )
    parser.add_argument(
        "--allow-public",
        action="store_true",
        help="Allow running on non-test schema/user with confirmation",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Execute a single cycle, display the table, and exit",
    )
    args = parser.parse_args()

    # Load configuration
    cfg = DslbConfig.from_env()
    if args.cycle_seconds is not None:
        cfg.cycle_seconds = args.cycle_seconds

    # Repository and Store
    repo = DslbRepository()
    store = OccupancyStore()
    engine_state = {}

    # Initial check on database connection
    conn = None
    try:
        conn = get_db_connection()
        check_runtime_schema(conn, allow_public=args.allow_public)
    except Exception as e:
        logger.error(f"❌ Connection or schema safety check failed: {e}")
        if conn:
            release_connection(conn, close=False)
        sys.exit(1)

    stop_requested = False

    def handle_sigint(signum, frame):
        nonlocal stop_requested
        logger.info("\n⏹️ Ctrl+C received. Gracefully exiting DSLB Watcher...")
        stop_requested = True

    signal.signal(signal.SIGINT, handle_sigint)

    logger.info(f"DSLB Watcher started. Cycle interval: {cfg.cycle_seconds:.1f}s. Press Ctrl+C to stop.")

    cycle_num = 1
    try:
        while not stop_requested:
            start_mono = time.monotonic()

            try:
                # 1. Execute engine cycle synchronously
                run_cycle(repo, store, engine_state, cfg, now_monotonic=start_mono)

                # 2. Query and display table from DB
                fetch_and_print_table(conn, cycle_num)

            except Exception as e:
                logger.error(f"❌ Error during DSLB cycle execution: {e}", exc_info=True)

            if args.once:
                break

            cycle_num += 1

            # Sleep remaining time until next cycle
            elapsed = time.monotonic() - start_mono
            sleep_duration = max(0.1, cfg.cycle_seconds - elapsed)

            # Sleep in short increments to respond to Ctrl+C promptly
            sleep_start = time.monotonic()
            while (time.monotonic() - sleep_start) < sleep_duration and not stop_requested:
                time.sleep(0.2)

    except KeyboardInterrupt:
        logger.info("\n⏹️ Exiting DSLB Watcher...")
    finally:
        if conn:
            release_connection(conn, close=False)
        logger.info("DSLB Watcher stopped.")


if __name__ == "__main__":
    main()

