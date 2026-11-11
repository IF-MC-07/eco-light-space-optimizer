import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime

# Setup paths so script can import app modules if needed
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.zona_loader import get_db_connection, release_connection
except ImportError:
    from zona_loader import get_db_connection, release_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("dslb_simulator")

SCENARIOS_FILE = os.path.join(os.path.dirname(__file__), "dslb_scenarios.json")


def load_scenarios_data() -> dict:
    if not os.path.exists(SCENARIOS_FILE):
        raise FileNotFoundError(f"Scenarios file not found: {SCENARIOS_FILE}")
    with open(SCENARIOS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


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

    if allow_public:
        logger.warning(f"⚠️ --allow-public flag detected. Target host: {host}, user: {user}, schema: {schema}")
        try:
            typed = input("Ketik 'TULIS KE PUBLIC' untuk melanjutkan: ").strip()
        except EOFError:
            typed = ""
        if typed != "TULIS KE PUBLIC":
            raise RuntimeError("Operasi dibatalkan: konfirmasi 'TULIS KE PUBLIC' tidak cocok.")
        logger.info("Konfirmasi 'TULIS KE PUBLIC' diterima.")


def confirm_prompt(prompt_text: str = "Proceed? [y/N]: ") -> bool:
    try:
        reply = input(prompt_text).strip().lower()
        return reply in ("y", "yes")
    except EOFError:
        return False


def seed_rooms(conn, seed_list: list, dry_run: bool = False):
    logger.info(f"Seeding {len(seed_list)} simulated rooms...")
    if dry_run:
        for r in seed_list:
            logger.info(f"[DRY-RUN] Would seed room: {r['room_id']} ({r['room_name']}) - Capacity {r.get('capacity')}")
        return

    sql = """
        INSERT INTO rooms (room_id, room_name, building, floor, capacity, location, status, is_simulated)
        VALUES (%(room_id)s, %(room_name)s, %(building)s, %(floor)s, %(capacity)s, %(location)s, %(status)s, %(is_simulated)s)
        ON CONFLICT (room_id) DO UPDATE SET
            room_name = EXCLUDED.room_name,
            building = EXCLUDED.building,
            floor = EXCLUDED.floor,
            capacity = EXCLUDED.capacity,
            location = EXCLUDED.location,
            status = EXCLUDED.status,
            is_simulated = EXCLUDED.is_simulated
        WHERE rooms.is_simulated = true;
    """
    with conn.cursor() as cur:
        for r in seed_list:
            cur.execute(sql, r)
    conn.commit()
    logger.info("✅ Seeded rooms successfully.")


def clear_counts(conn, dry_run: bool = False):
    logger.info("Clearing table simulated_room_counts...")
    if dry_run:
        logger.info("[DRY-RUN] Would DELETE FROM simulated_room_counts")
        return
    with conn.cursor() as cur:
        cur.execute("DELETE FROM simulated_room_counts")
    conn.commit()
    logger.info("✅ Cleared simulated_room_counts.")


def clear_rooms(conn, dry_run: bool = False):
    logger.info("Deleting all simulated rooms (is_simulated = true) and their counts...")
    if dry_run:
        logger.info("[DRY-RUN] Would DELETE FROM rooms WHERE is_simulated = true")
        return
    with conn.cursor() as cur:
        cur.execute("DELETE FROM simulated_room_counts WHERE room_id IN (SELECT room_id FROM rooms WHERE is_simulated = true)")
        cur.execute("DELETE FROM rooms WHERE is_simulated = true")
    conn.commit()
    logger.info("✅ Deleted simulated rooms.")


def verify_simulated_rooms(conn, room_ids: list):
    """Refuse to write counts for room_ids that are not is_simulated = true."""
    with conn.cursor() as cur:
        cur.execute("SELECT room_id, is_simulated FROM rooms WHERE room_id = ANY(%s)", (room_ids,))
        rows = dict(cur.fetchall())

    invalid = []
    for rid in room_ids:
        if rid not in rows:
            invalid.append(f"{rid} (not found in rooms)")
        elif not rows[rid]:
            invalid.append(f"{rid} (is_simulated is FALSE - physical room!)")

    if invalid:
        raise ValueError(f"Refusing to write simulation counts for non-simulated rooms: {', '.join(invalid)}")


def write_counts(conn, counts: dict, dry_run: bool = False):
    if not counts:
        return

    if dry_run:
        for rid, count in counts.items():
            logger.info(f"[DRY-RUN] Would write simulated_room_counts: room={rid}, count={count}")
        return

    verify_simulated_rooms(conn, list(counts.keys()))

    sql = """
        INSERT INTO simulated_room_counts (room_id, person_count, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (room_id) DO UPDATE SET
            person_count = EXCLUDED.person_count,
            updated_at = NOW();
    """
    with conn.cursor() as cur:
        for rid, count in counts.items():
            cur.execute(sql, (rid, count))
    conn.commit()
    logger.info(f"✅ Updated counts for {len(counts)} rooms.")


def hold_loop(conn, room_ids: list, hold_seconds: float = None, interval: float = 10.0, dry_run: bool = False):
    logger.info(f"🔄 Entering hold loop: refreshing updated_at every {interval}s to prevent stale state. Press Ctrl+C to stop.")
    start_time = time.time()
    try:
        while True:
            if hold_seconds and (time.time() - start_time) >= hold_seconds:
                logger.info(f"Hold period of {hold_seconds}s completed.")
                break

            time.sleep(interval)
            if dry_run:
                logger.info(f"[DRY-RUN] Refreshed updated_at for {len(room_ids)} rooms at {datetime.now().strftime('%H:%M:%S')}")
            else:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE simulated_room_counts SET updated_at = NOW() WHERE room_id = ANY(%s)",
                        (room_ids,)
                    )
                conn.commit()
                logger.info(f"Refreshed updated_at for {len(room_ids)} rooms at {datetime.now().strftime('%H:%M:%S')}")

    except KeyboardInterrupt:
        logger.info("\n⏹️ Stopped hold loop via Ctrl+C. Data preserved in DB.")


def list_scenarios(data: dict):
    print("\n" + "=" * 70)
    print("DSLB SIMULATOR SCENARIOS")
    print("=" * 70)
    for sc in data.get("scenarios", []):
        timed_badge = " [BERWAKTU]" if sc.get("is_timed") else ""
        sc_id_str = f"{sc['id']:02d}" if isinstance(sc["id"], int) else f"{sc['id']:>2}"
        print(f"[{sc_id_str}] {sc['name']}{timed_badge}")
        print(f"     Title: {sc.get('title')}")
        print(f"     Desc : {sc.get('description')}")
        print("-" * 70)
    print()


def run_scenario(conn, sc: dict, args, dry_run: bool = False):
    logger.info(f"\n🚀 Running Scenario #{sc['id']}: {sc['title']}")
    logger.info(f"Description: {sc['description']}")

    if not sc.get("is_timed"):
        counts = sc.get("counts", {})
        write_counts(conn, counts, dry_run=dry_run)

        if args.hold or args.hold_seconds:
            hold_loop(conn, list(counts.keys()), hold_seconds=args.hold_seconds, dry_run=dry_run)
        else:
            logger.info("ℹ️ Without --hold, simulated data will become 'Tidak tersedia' after DSLB_STALE_SECONDS.")

    else:
        # Timed scenario
        steps = sc.get("steps", [])
        step_seconds = args.step_seconds or 15
        logger.info(f"Timed scenario with {len(steps)} steps (interval: {step_seconds}s)")

        for i, step in enumerate(steps):
            logger.info(f"\n--- Step {i+1}/{len(steps)}: {step.get('step_name', f'Step {i+1}')} ---")
            counts = step.get("counts")
            if counts:
                write_counts(conn, counts, dry_run=dry_run)

            if i < len(steps) - 1:
                logger.info(f"Waiting {step_seconds}s before next step...")
                time.sleep(step_seconds)

        if args.hold or args.hold_seconds:
            last_counts = steps[-1].get("counts", {})
            hold_loop(conn, list(last_counts.keys()), hold_seconds=args.hold_seconds, dry_run=dry_run)


def main():
    parser = argparse.ArgumentParser(description="DSLB Room Occupancy Simulator")
    parser.add_argument("--list", action="store_true", help="List all available scenarios")
    parser.add_argument("--seed", action="store_true", help="Seed test rooms (ROM-s0000001 to ROM-s0000006)")
    parser.add_argument("--scenario", type=str, help="Run scenario by ID or name")
    parser.add_argument("--all", action="store_true", help="Run all scenarios sequentially")
    parser.add_argument("--clear", action="store_true", help="Clear simulated_room_counts table only")
    parser.add_argument("--clear-rooms", action="store_true", help="Delete simulated rooms and their counts")
    parser.add_argument("--dry-run", action="store_true", help="Dry run without writing to DB")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--allow-public", action="store_true", help="Allow running on schema other than schema_test")
    parser.add_argument("--hold", action="store_true", help="Keep refreshing updated_at until Ctrl+C")
    parser.add_argument("--hold-seconds", type=float, help="Keep refreshing updated_at for N seconds")
    parser.add_argument("--step-seconds", type=float, default=15.0, help="Interval between steps in timed scenarios (default: 15s)")

    args = parser.parse_args()

    data = load_scenarios_data()

    if args.list:
        list_scenarios(data)
        return

    # If no action specified
    if not (args.seed or args.scenario or args.all or args.clear or args.clear_rooms):
        parser.print_help()
        return

    # Database connection & safety checks
    conn = None
    try:
        conn = get_db_connection()
        check_runtime_schema(conn, allow_public=args.allow_public)

        # Confirmation unless --yes or --dry-run
        if not args.yes and not args.dry_run:
            if not confirm_prompt("Do you want to proceed with DB writes? [y/N]: "):
                logger.info("Aborted by user.")
                return

        if args.clear:
            clear_counts(conn, dry_run=args.dry_run)

        if args.clear_rooms:
            clear_rooms(conn, dry_run=args.dry_run)

        if args.seed:
            seed_rooms(conn, data.get("seed_rooms", []), dry_run=args.dry_run)

        if args.scenario:
            sc_target = None
            for sc in data.get("scenarios", []):
                if str(sc["id"]) == args.scenario or sc["name"].lower() == args.scenario.lower():
                    sc_target = sc
                    break

            if not sc_target:
                logger.error(f"Scenario '{args.scenario}' not found. Use --list to see available scenarios.")
                sys.exit(1)

            run_scenario(conn, sc_target, args, dry_run=args.dry_run)

        if args.all:
            for sc in data.get("scenarios", []):
                run_scenario(conn, sc, args, dry_run=args.dry_run)

    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        if conn:
            release_connection(conn, close=False)


if __name__ == "__main__":
    main()

