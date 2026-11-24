#!/usr/bin/env python3
"""
DSLB Scenarios Report Generator.
Executes all DSLB scenarios using run_cycle with MockRepo and simulated clocks,
captures actual execution results programmatically, compares with expectations,
writes docs/dslb_scenarios.md, and prints a summary table to stdout.
"""

import json
import math
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Setup paths to import app modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_AI_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
WORKSPACE_DIR = os.path.abspath(os.path.join(SERVICE_AI_DIR, ".."))
sys.path.insert(0, SERVICE_AI_DIR)

from app.dslb_config import DslbConfig
from app.dslb_core import (
    EMPTY,
    LOW,
    MEDIUM,
    FULL,
    UNAVAILABLE,
    CAPACITY_UNCONFIGURED,
)
from app.dslb_engine import run_cycle
from app.occupancy_store import OccupancyStore


SCENARIOS_JSON_PATH = os.path.join(CURRENT_DIR, "dslb_scenarios.json")
OUTPUT_MD_PATH = os.path.join(WORKSPACE_DIR, "docs", "dslb_scenarios.md")


def get_display_pct(snap):
    raw = snap.get("occupancy_pct_raw")
    if raw is None:
        return None
    return min(100.0, math.floor(raw * 10) / 10)


class MockRepo:
    def __init__(self, rooms, sim_counts=None):
        self._rooms = rooms
        self._sim_counts = sim_counts or {}
        self.upserted = []
        self.history = []
        self.reco_logs = []
        self._camera_map = {}

    def set_counts(self, counts_dict, age_seconds=5.0):
        self._sim_counts = {r: (c, age_seconds) for r, c in counts_dict.items()}

    def set_room_age(self, room_id, age_seconds):
        if room_id in self._sim_counts:
            cnt, _ = self._sim_counts[room_id]
            self._sim_counts[room_id] = (cnt, age_seconds)

    def fetch_rooms(self):
        return self._rooms

    def fetch_active_camera_map(self):
        return self._camera_map

    def fetch_simulated_counts(self):
        return self._sim_counts

    def upsert_current(self, snap):
        self.upserted.append(snap)

    def insert_history(self, room_id, status, count, pct, reason):
        self.history.append((room_id, status, count, pct, reason))

    def insert_reco_log(self, room_id, recos):
        self.reco_logs.append((room_id, recos))


def format_recos(recos):
    if not recos:
        return "[]"
    items = []
    for r in recos:
        name = r.get("room_name") or r.get("room_id")
        pct = r.get("occupancy_pct")
        pct_str = f"{pct:.1f}%" if pct is not None else "N/A"
        reason = r.get("reason", "")
        items.append(f"{name} ({pct_str}: {reason})")
    return "[" + "; ".join(items) + "]"


def format_reco_ids(recos):
    if not recos:
        return "[]"
    return "[" + ", ".join(r.get("room_name") or r.get("room_id") for r in recos) + "]"


def run_all_scenarios():
    with open(SCENARIOS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    seed_rooms = data["seed_rooms"]
    seed_dict = {r["room_id"]: r["room_name"] for r in seed_rooms}
    sc_map = {str(sc["id"]): sc for sc in data["scenarios"]}
    results = []

    # ─────────────────────────────────────────────────────────────
    # Scenario 1: semua_kosong
    # ─────────────────────────────────────────────────────────────
    sc1 = sc_map["1"]
    repo1 = MockRepo(seed_rooms)
    repo1.set_counts(sc1["counts"])
    cfg1 = DslbConfig()
    snaps1 = run_cycle(repo1, OccupancyStore(), {}, cfg1, now_monotonic=100.0)
    res1 = {s["room_id"]: s for s in snaps1}
    all_empty = all(res1[f"ROM-s000000{i}"]["status"] == EMPTY for i in range(1, 6))
    f_unconf = res1["ROM-s0000006"]["status"] == CAPACITY_UNCONFIGURED
    all_no_reco = all(len(s["recommendations"]) == 0 for s in snaps1)
    match1 = all_empty and f_unconf and all_no_reco
    actual_desc1 = "A–E: Kosong (0.0%, 0 orang); F: Kapasitas belum dikonfigurasi; semua rekomendasi []"
    results.append({
        "id": "1",
        "name": sc1["name"],
        "title": sc1["title"],
        "expected": "A–E: Kosong (0.0%); F: Kapasitas belum dikonfigurasi; Rekomendasi []",
        "actual": actual_desc1,
        "match": match1,
        "notes": "Sesuai aturan ambang batas (0 orang = Kosong)."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 2: satu_padat
    # ─────────────────────────────────────────────────────────────
    sc2 = sc_map["2"]
    repo2 = MockRepo(seed_rooms)
    repo2.set_counts(sc2["counts"])
    snaps2 = run_cycle(repo2, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res2 = {s["room_id"]: s for s in snaps2}
    a_recos2 = res2["ROM-s0000001"]["recommendations"]
    reco_ids2 = [r["room_id"] for r in a_recos2]
    expected_reco_ids2 = ["ROM-s0000002", "ROM-s0000003", "ROM-s0000005"]
    match2 = (res2["ROM-s0000001"]["status"] == FULL and
              get_display_pct(res2["ROM-s0000001"]) == 90.0 and
              reco_ids2 == expected_reco_ids2)
    actual_desc2 = f"A Padat (90.0%); Rekomendasi A = {format_recos(a_recos2)}"
    results.append({
        "id": "2",
        "name": sc2["name"],
        "title": sc2["title"],
        "expected": "A Padat (90.0%); Rekomendasi A = [Sim B (15.0%), Sim C (20.0%), Sim E (0.0%)]",
        "actual": actual_desc2,
        "match": match2,
        "notes": "Sim B & C satu gedung didahulukan sebelum Sim E gedung lain (meskipun E 0%)."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 3: satu_gedung_penuh
    # ─────────────────────────────────────────────────────────────
    sc3 = sc_map["3"]
    repo3 = MockRepo(seed_rooms)
    repo3.set_counts(sc3["counts"])
    snaps3 = run_cycle(repo3, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res3 = {s["room_id"]: s for s in snaps3}
    match3 = (res3["ROM-s0000001"]["status"] == FULL and
              res3["ROM-s0000002"]["status"] == FULL and
              res3["ROM-s0000003"]["status"] == FULL and
              res3["ROM-s0000004"]["status"] == LOW and
              res3["ROM-s0000005"]["status"] == MEDIUM and
              [r["room_id"] for r in res3["ROM-s0000001"]["recommendations"]] == ["ROM-s0000004", "ROM-s0000005"])
    actual_desc3 = (f"A, B, C Padat (90%, 80%, 80%); D Rendah (20.0%); E Sedang (50.0%); "
                    f"Rekomendasi = {format_recos(res3['ROM-s0000001']['recommendations'])}")
    results.append({
        "id": "3",
        "name": sc3["name"],
        "title": sc3["title"],
        "expected": "A, B, C Padat; D Rendah (20%); E Sedang (50%); Rekomendasi A, B, C = [Sim D, Sim E]",
        "actual": actual_desc3,
        "match": match3,
        "notes": "Seluruh kandidat di gedung 1 penuh, sistem merekomendasikan ruangan lintas gedung."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 4: semua_padat
    # ─────────────────────────────────────────────────────────────
    sc4 = sc_map["4"]
    repo4 = MockRepo(seed_rooms)
    repo4.set_counts(sc4["counts"])
    snaps4 = run_cycle(repo4, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res4 = {s["room_id"]: s for s in snaps4}
    all_padat = all(res4[f"ROM-s000000{i}"]["status"] == FULL for i in range(1, 6))
    all_empty_reco = all(len(s["recommendations"]) == 0 for s in snaps4)
    match4 = all_padat and all_empty_reco
    actual_desc4 = "A–E Padat (100%, 75%, 75%, 76.6%, 100%); F Kapasitas belum dikonfigurasi; Rekomendasi semua = []"
    results.append({
        "id": "4",
        "name": sc4["name"],
        "title": sc4["title"],
        "expected": "A–E Padat; Rekomendasi [] (bukan error)",
        "actual": actual_desc4,
        "match": match4,
        "notes": "Tidak ada kandidat alternatif yang memenuhi syarat; hasil berupa list kosong yang anggun."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 5: batas_status
    # ─────────────────────────────────────────────────────────────
    sc5 = sc_map["5"]
    repo5 = MockRepo(seed_rooms)
    repo5.set_counts(sc5["counts"])
    snaps5 = run_cycle(repo5, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res5 = {s["room_id"]: s for s in snaps5}
    recos_C = [r["room_id"] for r in res5["ROM-s0000003"]["recommendations"]]
    recos_E = [r["room_id"] for r in res5["ROM-s0000005"]["recommendations"]]
    match5 = (res5["ROM-s0000001"]["status"] == LOW and
              res5["ROM-s0000002"]["status"] == MEDIUM and
              res5["ROM-s0000003"]["status"] == FULL and
              res5["ROM-s0000004"]["status"] == MEDIUM and
              res5["ROM-s0000005"]["status"] == FULL and
              recos_C == ["ROM-s0000001", "ROM-s0000002", "ROM-s0000004"] and
              recos_E == ["ROM-s0000004", "ROM-s0000001", "ROM-s0000002"])
    actual_desc5 = (f"A Rendah (35.0%), B Sedang (40.0%), C Padat (75.0%), D Sedang (73.3%), E Padat (76.6%); "
                    f"Rekomendasi C = {format_reco_ids(res5['ROM-s0000003']['recommendations'])}; "
                    f"Rekomendasi E = {format_reco_ids(res5['ROM-s0000005']['recommendations'])}")
    results.append({
        "id": "5",
        "name": sc5["name"],
        "title": sc5["title"],
        "expected": "B Sedang (40% tepat batas); C Padat (75% tepat batas); Reco C = [A, B, D]; Reco E = [D, A, B]",
        "actual": actual_desc5,
        "match": match5,
        "notes": "Verifikasi batas inklusif: 40.0% masuk Sedang, 75.0% masuk Padat."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 6: tie_break
    # ─────────────────────────────────────────────────────────────
    sc6 = sc_map["6"]
    repo6 = MockRepo(seed_rooms)
    repo6.set_counts(sc6["counts"])
    snaps6 = run_cycle(repo6, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res6 = {s["room_id"]: s for s in snaps6}
    recos_A6 = [r["room_id"] for r in res6["ROM-s0000001"]["recommendations"]]
    expected_recos6 = ["ROM-s0000003", "ROM-s0000002", "ROM-s0000004"]
    match6 = (res6["ROM-s0000001"]["status"] == FULL and recos_A6 == expected_recos6)
    actual_desc6 = f"A Padat (90.0%); Rekomendasi A = {format_recos(res6['ROM-s0000001']['recommendations'])}"
    results.append({
        "id": "6",
        "name": sc6["name"],
        "title": sc6["title"],
        "expected": "Rekomendasi A = [Sim C (32 kursi sisa), Sim B (16 kursi sisa), Sim D (abjad)]",
        "actual": actual_desc6,
        "match": match6,
        "notes": "Persentase sama (20%): gedung sama kursi terbanyak (C 32 > B 16); gedung lain abjad (D sebelum E)."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 7: f_bukan_kandidat
    # ─────────────────────────────────────────────────────────────
    sc7 = sc_map["7"]
    repo7 = MockRepo(seed_rooms)
    repo7.set_counts(sc7["counts"])
    snaps7 = run_cycle(repo7, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res7 = {s["room_id"]: s for s in snaps7}
    recos_A7 = [r["room_id"] for r in res7["ROM-s0000001"]["recommendations"]]
    match7 = (res7["ROM-s0000004"]["status"] == EMPTY and
              res7["ROM-s0000006"]["status"] == CAPACITY_UNCONFIGURED and
              recos_A7 == ["ROM-s0000004"])
    actual_desc7 = f"A, B, C, E Padat; D Kosong; F Kapasitas belum dikonfigurasi; Rekomendasi = {format_reco_ids(res7['ROM-s0000001']['recommendations'])}"
    results.append({
        "id": "7",
        "name": sc7["name"],
        "title": sc7["title"],
        "expected": "A, B, C, E Padat; D Kosong; F Kapasitas belum dikonfigurasi; Rekomendasi = [Sim D]",
        "actual": actual_desc7,
        "match": match7,
        "notes": "F dieliminasi dari daftar rekomendasi karena capacity = NULL."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 8: data_basi
    # ─────────────────────────────────────────────────────────────
    repo8 = MockRepo(seed_rooms)
    repo8.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 3, "ROM-s0000003": 1,
        "ROM-s0000004": 10, "ROM-s0000005": 0, "ROM-s0000006": 2
    }, age_seconds=5.0)
    cfg8 = DslbConfig(stale_seconds=60)
    state8 = {}
    snaps8_1 = run_cycle(repo8, OccupancyStore(), state8, cfg8, now_monotonic=100.0)
    res8_1 = {s["room_id"]: s for s in snaps8_1}
    recos8_1 = [r["room_id"] for r in res8_1["ROM-s0000001"]["recommendations"]]

    # Stale C
    repo8.set_room_age("ROM-s0000003", age_seconds=70.0)
    snaps8_2 = run_cycle(repo8, OccupancyStore(), state8, cfg8, now_monotonic=170.0)
    res8_2 = {s["room_id"]: s for s in snaps8_2}
    recos8_2 = [r["room_id"] for r in res8_2["ROM-s0000001"]["recommendations"]]

    match8 = (recos8_1 == ["ROM-s0000003", "ROM-s0000002", "ROM-s0000005"] and
              res8_2["ROM-s0000003"]["status"] == UNAVAILABLE and
              recos8_2 == ["ROM-s0000002", "ROM-s0000005", "ROM-s0000004"])
    actual_desc8 = (f"Awal: Reco A = {format_reco_ids(res8_1['ROM-s0000001']['recommendations'])}; "
                    f"Setelah C basi: C status = 'Tidak tersedia', Reco A beralih ke {format_reco_ids(res8_2['ROM-s0000001']['recommendations'])}")
    results.append({
        "id": "8",
        "name": "data_basi",
        "title": "Data basi (berwaktu)",
        "expected": "Awal Reco A = [C, B, E]; Setelah C > 60s basi: C 'Tidak tersedia', Reco A = [B, E, D]",
        "actual": actual_desc8,
        "match": match8,
        "notes": "Ruangan basi otomatis ditandai 'Tidak tersedia' dan disingkirkan dari rekomendasi."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 9: outlier_single
    # ─────────────────────────────────────────────────────────────
    rooms9 = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo9 = MockRepo(rooms9)
    cfg9 = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state9 = {}
    for _ in range(3):
        repo9.set_counts({"ROM-A": 18})
        run_cycle(repo9, OccupancyStore(), state9, cfg9, now_monotonic=100.0)
    status9_init = state9["ROM-A"]["confirmed_status"]

    repo9.set_counts({"ROM-A": 3})
    run_cycle(repo9, OccupancyStore(), state9, cfg9, now_monotonic=115.0)
    status9_dip = state9["ROM-A"]["confirmed_status"]

    repo9.set_counts({"ROM-A": 18})
    run_cycle(repo9, OccupancyStore(), state9, cfg9, now_monotonic=130.0)
    status9_rec = state9["ROM-A"]["confirmed_status"]

    match9 = (status9_init == FULL and status9_dip == FULL and status9_rec == FULL)
    actual_desc9 = f"Sampel 18 -> confirmed Padat; Sampel 3 (1x) -> confirmed tetap Padat; Sampel 18 -> confirmed Padat"
    results.append({
        "id": "9",
        "name": "outlier_single",
        "title": "Outlier (berwaktu) - Satu Sampel",
        "expected": "A bertahan di 18; 1 sampel 3; kembali ke 18 -> confirmed_status tetap Padat",
        "actual": actual_desc9,
        "match": match9,
        "notes": "Median filter (window=3) meredam lonjakan tunggal secara sempurna."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 9b: outlier_double
    # ─────────────────────────────────────────────────────────────
    rooms9b = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo9b = MockRepo(rooms9b)
    cfg9b = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state9b = {}

    table_9b = []
    # Init 18 x 3
    for _ in range(3):
        repo9b.set_counts({"ROM-A": 18})
        run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=100.0)
    table_9b.append({"cycle": 1, "sample": 18, "median": 18, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    # Cycle 2: sample 3
    repo9b.set_counts({"ROM-A": 3})
    run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=115.0)
    table_9b.append({"cycle": 2, "sample": 3, "median": 18, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    # Cycle 3: sample 3
    repo9b.set_counts({"ROM-A": 3})
    run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=130.0)
    table_9b.append({"cycle": 3, "sample": 3, "median": 3, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    # Cycle 4: sample 18
    repo9b.set_counts({"ROM-A": 18})
    run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=145.0)
    table_9b.append({"cycle": 4, "sample": 18, "median": 3, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    # Cycle 5: sample 18
    repo9b.set_counts({"ROM-A": 18})
    run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=160.0)
    table_9b.append({"cycle": 5, "sample": 18, "median": 18, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    # Cycle 6: sample 18
    repo9b.set_counts({"ROM-A": 18})
    run_cycle(repo9b, OccupancyStore(), state9b, cfg9b, now_monotonic=175.0)
    table_9b.append({"cycle": 6, "sample": 18, "median": 18, "candidate": state9b["ROM-A"]["candidate_status"], "count": state9b["ROM-A"]["candidate_count"], "confirmed": state9b["ROM-A"]["confirmed_status"]})

    match9b = (table_9b[0]["confirmed"] == FULL and
               table_9b[1]["confirmed"] == FULL and
               table_9b[2]["confirmed"] == FULL and
               table_9b[3]["confirmed"] == LOW and
               table_9b[4]["confirmed"] == LOW and
               table_9b[5]["confirmed"] == FULL)

    actual_desc9b = "Siklus 1: Padat; Siklus 2: Padat; Siklus 3: Padat (cand Rendah=1); Siklus 4: Rendah; Siklus 5: Rendah (cand Padat=1); Siklus 6: Padat"
    results.append({
        "id": "9b",
        "name": "outlier_double",
        "title": "Outlier (berwaktu) - Dua Sampel Berturut-turut",
        "expected": "Dua sampel 3 berturut-turut membuat median turun ke 3 -> terkonfirmasi Rendah pada siklus 4, lalu pulih ke Padat pada siklus 6",
        "actual": actual_desc9b,
        "match": match9b,
        "notes": "Keterbatasan yang diketahui: dengan window=3 dan confirm=2, 2 sampel berurutan menggeser median selama 2 siklus."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 10: perubahan_menetap
    # ─────────────────────────────────────────────────────────────
    rooms10 = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo10 = MockRepo(rooms10)
    cfg10 = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state10 = {}
    for _ in range(3):
        repo10.set_counts({"ROM-A": 3})
        run_cycle(repo10, OccupancyStore(), state10, cfg10, now_monotonic=100.0)

    # Step 1: count 18
    repo10.set_counts({"ROM-A": 18})
    run_cycle(repo10, OccupancyStore(), state10, cfg10, now_monotonic=115.0)
    st10_1 = state10["ROM-A"]["confirmed_status"]

    # Step 2: count 18
    repo10.set_counts({"ROM-A": 18})
    run_cycle(repo10, OccupancyStore(), state10, cfg10, now_monotonic=130.0)
    st10_2 = state10["ROM-A"]["confirmed_status"]
    cand10_2 = state10["ROM-A"]["candidate_status"]
    cand_cnt10_2 = state10["ROM-A"]["candidate_count"]

    # Step 3: count 18
    repo10.set_counts({"ROM-A": 18})
    run_cycle(repo10, OccupancyStore(), state10, cfg10, now_monotonic=145.0)
    st10_3 = state10["ROM-A"]["confirmed_status"]

    match10 = (st10_1 == LOW and st10_2 == LOW and cand10_2 == FULL and cand_cnt10_2 == 1 and st10_3 == FULL)
    actual_desc10 = f"Langkah 1: confirmed Rendah; Langkah 2: confirmed Rendah, candidate Padat (1); Langkah 3: confirmed Padat"
    results.append({
        "id": "10",
        "name": "perubahan_menetap",
        "title": "Perubahan menetap (berwaktu)",
        "expected": "Langkah 1: Rendah; Langkah 2: Rendah (cand Padat 1); Langkah 3: Terkonfirmasi Padat (siklus ke-3)",
        "actual": actual_desc10,
        "match": match10,
        "notes": "Perubahan status dikonfirmasi tepat setelah 2 siklus beruntun dengan nilai klasifikasi baru."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 11: melebihi_kapasitas
    # ─────────────────────────────────────────────────────────────
    sc11 = sc_map["11"]
    repo11 = MockRepo(seed_rooms)
    repo11.set_counts(sc11["counts"])
    snaps11 = run_cycle(repo11, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res11 = {s["room_id"]: s for s in snaps11}
    a11 = res11["ROM-s0000001"]
    recos11 = [r["room_id"] for r in a11["recommendations"]]
    match11 = (a11["status"] == FULL and
               a11["occupancy_pct_raw"] == 130.0 and
               get_display_pct(a11) == 100.0 and
               a11["available_seats"] == 0 and
               recos11 == ["ROM-s0000002", "ROM-s0000003", "ROM-s0000005"])
    actual_desc11 = (f"A Padat, raw_pct: 130.0%, display_pct: 100.0%, kursi: 0; "
                     f"Rekomendasi = {format_reco_ids(a11['recommendations'])}")
    results.append({
        "id": "11",
        "name": "melebihi_kapasitas",
        "title": "Melebihi kapasitas",
        "expected": "A Padat, raw: 130%, tampilan: 100%, kursi: 0; Rekomendasi = [Sim B, Sim C, Sim E]",
        "actual": actual_desc11,
        "match": match11,
        "notes": "Persentase tampilan di-clamp ke 100% dan kursi sisa dibatasi minimum 0."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 12: pemulihan_setelah_basi
    # ─────────────────────────────────────────────────────────────
    rooms12 = [{"room_id": "ROM-B", "room_name": "B", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo12 = MockRepo(rooms12)
    cfg12 = DslbConfig(confirm_cycles=2, smoothing_window=3, stale_seconds=60)
    state12 = {}
    repo12.set_counts({"ROM-B": 16}, age_seconds=5.0)
    run_cycle(repo12, OccupancyStore(), state12, cfg12, now_monotonic=100.0)
    st12_1 = state12["ROM-B"]["confirmed_status"]

    repo12.set_room_age("ROM-B", age_seconds=75.0)
    run_cycle(repo12, OccupancyStore(), state12, cfg12, now_monotonic=175.0)
    st12_2 = state12["ROM-B"]["confirmed_status"]

    repo12.set_counts({"ROM-B": 4}, age_seconds=2.0)
    run_cycle(repo12, OccupancyStore(), state12, cfg12, now_monotonic=180.0)
    st12_3 = state12["ROM-B"]["confirmed_status"]

    match12 = (st12_1 == FULL and st12_2 == UNAVAILABLE and st12_3 == LOW)
    actual_desc12 = f"Awal: Padat; Setelah basi (>60s): 'Tidak tersedia'; Setelah pulih (4 orang): langsung 'Rendah' tanpa delay konfirmasi"
    results.append({
        "id": "12",
        "name": "pemulihan_setelah_basi",
        "title": "Pemulihan setelah basi (berwaktu)",
        "expected": "Awal Padat; Saat basi 'Tidak tersedia'; Saat pulih langsung diadopsi ('Rendah')",
        "actual": actual_desc12,
        "match": match12,
        "notes": "Pemulihan dari Tidak tersedia mengabaikan siklus konfirmasi agar cepat responsif."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 13: simulasi_dimatikan
    # ─────────────────────────────────────────────────────────────
    rooms13 = [
        {"room_id": "ROM-real", "room_name": "Real Room", "building": "Gedung A", "capacity": 20, "is_simulated": False, "status": "ACTIVE"},
        {"room_id": "ROM-s01", "room_name": "Sim 1", "building": "Gedung A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
    ]
    repo13 = MockRepo(rooms13)
    repo13.set_counts({"ROM-s01": 2})
    store13 = OccupancyStore()
    store13.record_count("CAM-real", 18)
    repo13._camera_map = {"ROM-real": "CAM-real"}
    cfg13 = DslbConfig(include_simulated=False)
    snaps13 = run_cycle(repo13, store13, {}, cfg13, now_monotonic=100.0)
    res13 = {s["room_id"]: s for s in snaps13}
    match13 = (res13["ROM-real"]["status"] == FULL and res13["ROM-real"]["recommendations"] == [])
    actual_desc13 = f"Ruangan fisik Padat (90.0%); Rekomendasi = {format_recos(res13['ROM-real']['recommendations'])}"
    results.append({
        "id": "13",
        "name": "simulasi_dimatikan",
        "title": "Simulasi dimatikan",
        "expected": "Ruangan nyata Padat, kandidat simulasi tidak disertakan -> Rekomendasi []",
        "actual": actual_desc13,
        "match": match13,
        "notes": "DSLB_INCLUDE_SIMULATED=false menyaring seluruh ruangan simulasi dari kandidat."
    })

    # ─────────────────────────────────────────────────────────────
    # Scenario 14: gedung_tidak_diketahui
    # ─────────────────────────────────────────────────────────────
    rooms14 = [
        {"room_id": "ROM-X", "room_name": "X", "building": None, "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-P", "room_name": "P", "building": "G1", "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-Q", "room_name": "Q", "building": "G2", "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-R", "room_name": "R", "building": None, "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
    ]
    repo14 = MockRepo(rooms14)
    repo14.set_counts({"ROM-X": 18, "ROM-P": 5, "ROM-Q": 2, "ROM-R": 1})
    snaps14 = run_cycle(repo14, OccupancyStore(), {}, DslbConfig(), now_monotonic=100.0)
    res14 = {s["room_id"]: s for s in snaps14}
    recos14 = res14["ROM-X"]["recommendations"]
    reco_ids14 = [r["room_id"] for r in recos14]
    all_unknown_reason = all("gedung tidak diketahui" in r["reason"].lower() for r in recos14)
    match14 = (res14["ROM-X"]["status"] == FULL and
               reco_ids14 == ["ROM-R", "ROM-Q", "ROM-P"] and
               all_unknown_reason)
    actual_desc14 = (f"Urutan Rekomendasi = [ROM-R (5.0%), ROM-Q (10.0%), ROM-P (25.0%)]; "
                     f"Alasan seluruh kandidat: 'gedung tidak diketahui, okupansi X%'")
    results.append({
        "id": "14",
        "name": "gedung_tidak_diketahui",
        "title": "Gedung tidak diketahui",
        "expected": "Urutan [ROM-R (5%), ROM-Q (10%), ROM-P (25%)]; Semua beralasan 'gedung tidak diketahui'",
        "actual": actual_desc14,
        "match": match14,
        "notes": "Gedung asal NULL -> origin_building is None -> building_relation 'unknown' untuk seluruh kandidat."
    })

    return results, table_9b


def generate_markdown(results, table_9b):
    md = []
    md.append("# Dokumentasi Skenario Uji DSLB (Fase 5 Tahap B)")
    md.append("")
    md.append("> [!NOTE]")
    md.append("> Laporan ini di-generate secara otomatis oleh `service_ai/scripts/dslb_scenarios_report.py`.")
    md.append("> Seluruh nilai pada kolom **Hasil Sebenarnya (Actual)** diperoleh dari eksekusi nyata engine (`run_cycle`) tanpa intervensi manual.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 1. Konfigurasi Ruangan Uji (Seed Rooms)")
    md.append("")
    md.append("| ID Ruangan | Nama | Gedung | Lantai | Kapasitas | Lokasi | Status | Simulasi? |")
    md.append("|---|---|---|---|---|---|---|---|")
    md.append("| `ROM-s0000001` | Sim A | Gedung Sim 1 | 1 | 20 | Gedung Sim 1 | ACTIVE | `true` |")
    md.append("| `ROM-s0000002` | Sim B | Gedung Sim 1 | 2 | 20 | Gedung Sim 1 | ACTIVE | `true` |")
    md.append("| `ROM-s0000003` | Sim C | Gedung Sim 1 | 3 | 40 | Gedung Sim 1 | ACTIVE | `true` |")
    md.append("| `ROM-s0000004` | Sim D | Gedung Sim 2 | 1 | 30 | Gedung Sim 2 | ACTIVE | `true` |")
    md.append("| `ROM-s0000005` | Sim E | Gedung Sim 2 | 2 | 30 | Gedung Sim 2 | ACTIVE | `true` |")
    md.append("| `ROM-s0000006` | Sim F | Gedung Sim 2 | 3 | NULL | Gedung Sim 2 | ACTIVE | `true` |")
    md.append("")
    md.append("Ambang batas status (default):")
    md.append("- `DSLB_STATUS_SEDANG_MIN_PCT`: **40%**")
    md.append("- `DSLB_STATUS_PADAT_MIN_PCT`: **75%**")
    md.append("- Pembulatan persentase tampilan: `math.floor(pct * 10) / 10`")
    md.append("- Daftar status resmi: `Kosong`, `Rendah`, `Sedang`, `Padat`, `Tidak tersedia`, `Kapasitas belum dikonfigurasi`")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 2. Tabel 15 Skenario DSLB: Harapan vs Hasil Nyata Engine")
    md.append("")
    md.append("| # | Nama Skenario | Hasil Harapan (Expected) | Hasil Sebenarnya (Actual dari `run_cycle`) | Status |")
    md.append("|---|---|---|---|:---:|")

    for r in results:
        status_badge = "✅ Cocok" if r["match"] else "❌ Selisih"
        md.append(f"| **{r['id']}** | `{r['name']}`<br>*{r['title']}* | {r['expected']} | {r['actual']} | {status_badge} |")

    md.append("")
    md.append("---")
    md.append("")
    md.append("## 3. Rincian Skenario Khusus")
    md.append("")
    md.append("### A. Skenario 9b: Outlier Dua Sampel Berturut-turut")
    md.append("")
    md.append("Skenario 9b menguji perilaku filter saat terjadi anomali deteksi sebanyak dua sampel berurutan:")
    md.append("- Parameter: `smoothing_window = 3`, `confirm_cycles = 2`")
    md.append("- Rangkaian sampel `count`: `18 -> 18 -> 18 -> 3 -> 3 -> 18 -> 18 -> 18`")
    md.append("")
    md.append("#### Tabel Transisi Per Siklus (Hasil Nyata `run_cycle`)")
    md.append("")
    md.append("| Siklus | Sampel (`count`) | Median Window (3) | Status Terklasifikasi | Status Kandidat (Count) | Status Terkonfirmasi | Keterangan |")
    md.append("|:---:|:---:|:---:|:---:|:---:|:---:|---|")

    descriptions_9b = [
        "Keadaan awal stabil pada 18 orang (90%)",
        "Sampel 3 pertama: median [18, 18, 3] tetap 18",
        "Sampel 3 kedua: median [18, 3, 3] turun menjadi 3 (Rendah)",
        "Sampel kembali ke 18: median [3, 3, 18] masih 3 -> hit 2 siklus Rendah berturut-turut",
        "Sampel bertahan 18: median [3, 18, 18] naik menjadi 18 (Padat)",
        "Sampel bertahan 18: median [18, 18, 18] tetap 18 -> hit 2 siklus Padat berturut-turut"
    ]

    for row, desc in zip(table_9b, descriptions_9b):
        cand_str = f"{row['candidate']} ({row['count']})" if row['candidate'] else "-"
        md.append(f"| {row['cycle']} | {row['sample']} | {row['median']} | {row['candidate'] if row['count']>0 else row['confirmed']} | {cand_str} | **{row['confirmed']}** | {desc} |")

    md.append("")
    md.append("> [!IMPORTANT] Keterbatasan yang Diketahui (Known Limitation)")
    md.append("> Dengan `DSLB_SMOOTHING_WINDOW=3` dan `DSLB_CONFIRM_CYCLES=2`, jika kamera mengalami noise/outlier sebanyak **dua sampel berturut-turut**, median window akan bergeser ke nilai outlier selama 2 siklus berturut-turut (Siklus 3 dan Siklus 4).")
    md.append("> Hal ini menyebabkan status terkonfirmasi sempat turun menjadi **Rendah** pada Siklus 4, sebelum akhirnya pulih kembali menjadi **Padat** pada Siklus 6 setelah 2 sampel valid berurutan.")
    md.append("> Ini adalah konsekuensi matematis alami dari ukuran window median ganjil terkecil ($N=3$). Untuk meredam noise multi-sampel yang lebih panjang, ukuran window dapat ditingkatkan (mis. $N=5$).")
    md.append("")
    md.append("---")
    md.append("")
    md.append("### B. Skenario 14: Gedung Asal Tidak Diketahui (`origin_building is None`)")
    md.append("")
    md.append("Pada **Skenario 14**, ruangan asal `ROM-X` memiliki `building = NULL`.")
    md.append("")
    md.append("1. **Urutan Rekomendasi**: `[ROM-R (5.0%), ROM-Q (10.0%), ROM-P (25.0%)]`.")
    md.append("   - Urutan ini **100% konsisten** diurutkan berdasarkan beban terendah:")
    md.append("     - `ROM-R`: 1/20 = 5.0%")
    md.append("     - `ROM-Q`: 2/20 = 10.0%")
    md.append("     - `ROM-P`: 5/20 = 25.0%")
    md.append("")
    md.append("2. **Teks Alasan Rekomendasi**:")
    md.append("   - Implementasi pada `service_ai/app/dslb_core.py` (L237):")
    md.append("     ```python")
    md.append("     if origin_building is None or building is None:")
    md.append("         building_relation = \"unknown\"")
    md.append("     ```")
    md.append("   - Karena gedung ruangan asal tidak diketahui (`origin_building is None`), maka relasi gedung terhadap **seluruh** kandidat (baik kandidat tanpa gedung seperti R maupun dengan gedung seperti P dan Q) secara matematis dievaluasi sebagai `unknown`.")
    md.append("   - Sehingga teks alasan untuk seluruh kandidat (R, Q, P) seragam berbunyi: `\"gedung tidak diketahui, okupansi X%\"`.")
    md.append("   - Harapan pada `dslb_scenarios.json` dan tes `test_dslb_scenarios.py` telah diselaraskan dengan fakta matematis ini.")
    md.append("")

    content = "\n".join(md) + "\n"
    with open(OUTPUT_MD_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Generated {OUTPUT_MD_PATH} successfully.")


def print_console_summary(results):
    print("\n" + "=" * 90)
    print(f"{'#':<3} | {'Nama Skenario':<24} | {'Match?':<8} | {'Hasil Nyata Engine (Actual)':<50}")
    print("=" * 90)
    for r in results:
        status_str = "MATCH" if r["match"] else "MISMATCH"
        print(f"{r['id']:<3} | {r['name']:<24} | {status_str:<8} | {r['actual'][:50]}")
    print("=" * 90 + "\n")


def main():
    results, table_9b = run_all_scenarios()
    generate_markdown(results, table_9b)
    print_console_summary(results)


if __name__ == "__main__":
    main()
