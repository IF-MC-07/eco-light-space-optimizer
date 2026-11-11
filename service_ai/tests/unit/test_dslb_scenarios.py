import pytest
import math
from unittest.mock import MagicMock

from app.dslb_config import DslbConfig
from app.dslb_core import (
    EMPTY,
    LOW,
    MEDIUM,
    FULL,
    UNAVAILABLE,
    CAPACITY_UNCONFIGURED,
)
from app.dslb_engine import run_cycle, _init_room_state
from app.occupancy_store import OccupancyStore


def get_seed_rooms():
    return [
        {"room_id": "ROM-s0000001", "room_name": "Sim A", "building": "Gedung Sim 1", "floor": "1", "capacity": 20, "location": "Gedung Sim 1", "status": "ACTIVE", "is_simulated": True},
        {"room_id": "ROM-s0000002", "room_name": "Sim B", "building": "Gedung Sim 1", "floor": "2", "capacity": 20, "location": "Gedung Sim 1", "status": "ACTIVE", "is_simulated": True},
        {"room_id": "ROM-s0000003", "room_name": "Sim C", "building": "Gedung Sim 1", "floor": "3", "capacity": 40, "location": "Gedung Sim 1", "status": "ACTIVE", "is_simulated": True},
        {"room_id": "ROM-s0000004", "room_name": "Sim D", "building": "Gedung Sim 2", "floor": "1", "capacity": 30, "location": "Gedung Sim 2", "status": "ACTIVE", "is_simulated": True},
        {"room_id": "ROM-s0000005", "room_name": "Sim E", "building": "Gedung Sim 2", "floor": "2", "capacity": 30, "location": "Gedung Sim 2", "status": "ACTIVE", "is_simulated": True},
        {"room_id": "ROM-s0000006", "room_name": "Sim F", "building": "Gedung Sim 2", "floor": "3", "capacity": None, "location": "Gedung Sim 2", "status": "ACTIVE", "is_simulated": True},
    ]


class MockRepo:
    def __init__(self, rooms, sim_counts=None):
        self._rooms = rooms
        self._sim_counts = sim_counts or {}
        self.upserted = []
        self.history = []
        self.reco_logs = []

    def set_counts(self, counts_dict, age_seconds=5.0):
        self._sim_counts = {r: (c, age_seconds) for r, c in counts_dict.items()}

    def set_room_age(self, room_id, age_seconds):
        if room_id in self._sim_counts:
            cnt, _ = self._sim_counts[room_id]
            self._sim_counts[room_id] = (cnt, age_seconds)

    def fetch_rooms(self):
        return self._rooms

    def fetch_active_camera_map(self):
        return {}

    def fetch_simulated_counts(self):
        return self._sim_counts

    def upsert_current(self, snap):
        self.upserted.append(snap)

    def insert_history(self, room_id, status, count, pct, reason):
        self.history.append((room_id, status, count, pct, reason))

    def insert_reco_log(self, room_id, recos):
        self.reco_logs.append((room_id, recos))


# ── Scenario 1: Semua Kosong ──────────────────────────────────────────────────
def test_scenario_01_semua_kosong():
    """1. Semua kosong: 0,0,0,0,0,0 -> A-E Kosong; F Kapasitas belum dikonfigurasi; semua rekomendasi kosong."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 0, "ROM-s0000002": 0, "ROM-s0000003": 0,
        "ROM-s0000004": 0, "ROM-s0000005": 0, "ROM-s0000006": 0
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    for r in ["ROM-s0000001", "ROM-s0000002", "ROM-s0000003", "ROM-s0000004", "ROM-s0000005"]:
        assert res[r]["status"] == EMPTY
        assert res[r]["person_count"] == 0
        assert res[r]["occupancy_pct_raw"] == 0.0
        assert res[r]["recommendations"] == []

    assert res["ROM-s0000006"]["status"] == CAPACITY_UNCONFIGURED
    assert res["ROM-s0000006"]["person_count"] is None
    assert res["ROM-s0000006"]["recommendations"] == []


# ── Scenario 2: Satu Padat ────────────────────────────────────────────────────
def test_scenario_02_satu_padat():
    """2. Satu padat: 18,3,8,10,0,2 -> A Padat 90%. Rekomendasi A = [B 15%, C 20%, E 0%] (B dan C gedung sama; E gedung lain)."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 3, "ROM-s0000003": 8,
        "ROM-s0000004": 10, "ROM-s0000005": 0, "ROM-s0000006": 2
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-s0000001"]["status"] == FULL
    assert res["ROM-s0000001"]["occupancy_pct_raw"] == 90.0
    assert res["ROM-s0000002"]["status"] == LOW
    assert res["ROM-s0000003"]["status"] == LOW
    assert res["ROM-s0000004"]["status"] == LOW
    assert res["ROM-s0000005"]["status"] == EMPTY

    recos_A = [r["room_id"] for r in res["ROM-s0000001"]["recommendations"]]
    assert recos_A == ["ROM-s0000002", "ROM-s0000003", "ROM-s0000005"]


# ── Scenario 3: Satu Gedung Penuh ─────────────────────────────────────────────
def test_scenario_03_satu_gedung_penuh():
    """3. Satu gedung penuh: 18,16,32,6,15,1 -> A, B, C Padat (90%, 80%, 80%); D Rendah 20%; E Sedang 50%.
    Rekomendasi A, B, dan C masing-masing = [D, E]."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 16, "ROM-s0000003": 32,
        "ROM-s0000004": 6, "ROM-s0000005": 15, "ROM-s0000006": 1
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-s0000001"]["status"] == FULL
    assert res["ROM-s0000002"]["status"] == FULL
    assert res["ROM-s0000003"]["status"] == FULL
    assert res["ROM-s0000004"]["status"] == LOW
    assert res["ROM-s0000005"]["status"] == MEDIUM

    for r in ["ROM-s0000001", "ROM-s0000002", "ROM-s0000003"]:
        recos = [x["room_id"] for x in res[r]["recommendations"]]
        assert recos == ["ROM-s0000004", "ROM-s0000005"]


# ── Scenario 4: Semua Padat ───────────────────────────────────────────────────
def test_scenario_04_semua_padat():
    """4. Semua padat: 20,15,30,23,30,5 -> A 100%, B 75%, C 75%, D 76,6%, E 100%, semuanya Padat; F tanpa kapasitas.
    Semua rekomendasi kosong dengan pesan jelas, bukan error."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 20, "ROM-s0000002": 15, "ROM-s0000003": 30,
        "ROM-s0000004": 23, "ROM-s0000005": 30, "ROM-s0000006": 5
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    for r in ["ROM-s0000001", "ROM-s0000002", "ROM-s0000003", "ROM-s0000004", "ROM-s0000005"]:
        assert res[r]["status"] == FULL
        assert res[r]["recommendations"] == []


# ── Scenario 5: Batas Status ──────────────────────────────────────────────────
def test_scenario_05_batas_status():
    """5. Batas status: 7,8,30,22,23,1 -> A Rendah 35%; B Sedang 40% (tepat); C Padat 75% (tepat);
    D Sedang 73,3%; E Padat 76,6%. Rekomendasi C = [A, B, D]; rekomendasi E = [D, A, B]."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 7, "ROM-s0000002": 8, "ROM-s0000003": 30,
        "ROM-s0000004": 22, "ROM-s0000005": 23, "ROM-s0000006": 1
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-s0000001"]["status"] == LOW
    assert res["ROM-s0000002"]["status"] == MEDIUM
    assert res["ROM-s0000003"]["status"] == FULL
    assert res["ROM-s0000004"]["status"] == MEDIUM
    assert res["ROM-s0000005"]["status"] == FULL

    recos_C = [r["room_id"] for r in res["ROM-s0000003"]["recommendations"]]
    assert recos_C == ["ROM-s0000001", "ROM-s0000002", "ROM-s0000004"]

    recos_E = [r["room_id"] for r in res["ROM-s0000005"]["recommendations"]]
    assert recos_E == ["ROM-s0000004", "ROM-s0000001", "ROM-s0000002"]


# ── Scenario 6: Tie-break ─────────────────────────────────────────────────────
def test_scenario_06_tie_break():
    """6. Tie-break: 18,4,8,6,6,0 -> A Padat. B, C, D, E semuanya 20%. Rekomendasi A = [C, B, D]
    (sama persen: kursi terbanyak dulu C 32 sisa sebelum B 16 sisa; lalu gedung lain D sebelum E karena nama)."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 4, "ROM-s0000003": 8,
        "ROM-s0000004": 6, "ROM-s0000005": 6, "ROM-s0000006": 0
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-s0000001"]["status"] == FULL
    recos_A = [r["room_id"] for r in res["ROM-s0000001"]["recommendations"]]
    assert recos_A == ["ROM-s0000003", "ROM-s0000002", "ROM-s0000004"]


# ── Scenario 7: F Bukan Kandidat ──────────────────────────────────────────────
def test_scenario_07_f_bukan_kandidat():
    """7. F bukan kandidat: 18,19,40,0,30,0 -> A, B, C, E Padat; D Kosong; F 'Kapasitas belum dikonfigurasi'.
    Rekomendasi A, B, C, dan E masing-masing = [D]."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 19, "ROM-s0000003": 40,
        "ROM-s0000004": 0, "ROM-s0000005": 30, "ROM-s0000006": 0
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    for r in ["ROM-s0000001", "ROM-s0000002", "ROM-s0000003", "ROM-s0000005"]:
        recos = [x["room_id"] for x in res[r]["recommendations"]]
        assert recos == ["ROM-s0000004"]
    assert res["ROM-s0000004"]["status"] == EMPTY


# ── Scenario 8: Data Basi (Berwaktu) ──────────────────────────────────────────
def test_scenario_08_data_basi():
    """8. Data basi (berwaktu): awal 18,3,1,10,0,2 -> rekomendasi A = [C 2,5%, B 15%, E 0%].
    Simulator berhenti menyegarkan C; setelah lebih dari DSLB_STALE_SECONDS, C 'Tidak tersedia'
    dan rekomendasi A = [B, E, D]."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 18, "ROM-s0000002": 3, "ROM-s0000003": 1,
        "ROM-s0000004": 10, "ROM-s0000005": 0, "ROM-s0000006": 2
    }, age_seconds=5.0)
    cfg = DslbConfig(stale_seconds=60)
    state = {}

    snapshots1 = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res1 = {s["room_id"]: s for s in snapshots1}
    recos1 = [r["room_id"] for r in res1["ROM-s0000001"]["recommendations"]]
    assert recos1 == ["ROM-s0000003", "ROM-s0000002", "ROM-s0000005"]

    repo.set_room_age("ROM-s0000003", age_seconds=70.0)
    snapshots2 = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=170.0)
    res2 = {s["room_id"]: s for s in snapshots2}

    assert res2["ROM-s0000003"]["status"] == UNAVAILABLE
    recos2 = [r["room_id"] for r in res2["ROM-s0000001"]["recommendations"]]
    assert recos2 == ["ROM-s0000002", "ROM-s0000005", "ROM-s0000004"]


# ── Scenario 9: Outlier Single (Berwaktu) ──────────────────────────────────────
def test_scenario_09_outlier():
    """9. Outlier (berwaktu) 1 sampel: A bertahan 18; satu sampel 3 lalu kembali 18 -> status terkonfirmasi A tetap Padat."""
    rooms = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo = MockRepo(rooms)
    cfg = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state = {}

    for _ in range(3):
        repo.set_counts({"ROM-A": 18})
        run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    assert state["ROM-A"]["confirmed_status"] == FULL

    # One outlier sample of 3
    repo.set_counts({"ROM-A": 3})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=115.0)
    assert state["ROM-A"]["confirmed_status"] == FULL

    # Return to 18
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=130.0)
    assert state["ROM-A"]["confirmed_status"] == FULL


# ── Scenario 9b: Outlier Double (Berwaktu) ────────────────────────────────────
def test_scenario_09b_outlier_double():
    """9b. Outlier (berwaktu) 2 sampel berturut-turut:
    A bertahan 18 lalu dua sampel 3 berturut-turut lalu kembali 18, kapasitas 20,
    DSLB_SMOOTHING_WINDOW=3 dan DSLB_CONFIRM_CYCLES=2.
    Kunci perilaku nyata per siklus:
    Cycle 1: 18 -> window [18, 18, 18], median 18, classified Padat, confirmed Padat
    Cycle 2: 3  -> window [18, 18, 3],  median 18, classified Padat, confirmed Padat
    Cycle 3: 3  -> window [18, 3, 3],   median 3,  classified Rendah, candidate Rendah (count 1), confirmed Padat
    Cycle 4: 18 -> window [3, 3, 18],   median 3,  classified Rendah, candidate Rendah reaches 2 -> confirmed Rendah!
    Cycle 5: 18 -> window [3, 18, 18],  median 18, classified Padat, candidate Padat (count 1), confirmed Rendah
    Cycle 6: 18 -> window [18, 18, 18], median 18, classified Padat, candidate Padat reaches 2 -> confirmed Padat!
    """
    rooms = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo = MockRepo(rooms)
    cfg = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state = {}

    # Initialize at 18
    for _ in range(3):
        repo.set_counts({"ROM-A": 18})
        run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    assert state["ROM-A"]["confirmed_status"] == FULL

    # Cycle 2: First 3
    repo.set_counts({"ROM-A": 3})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=115.0)
    assert state["ROM-A"]["confirmed_status"] == FULL
    assert state["ROM-A"]["candidate_status"] is None

    # Cycle 3: Second 3
    repo.set_counts({"ROM-A": 3})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=130.0)
    assert state["ROM-A"]["confirmed_status"] == FULL
    assert state["ROM-A"]["candidate_status"] == LOW
    assert state["ROM-A"]["candidate_count"] == 1

    # Cycle 4: Returns to 18 (window [3, 3, 18] has median 3) -> confirms Rendah
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=145.0)
    assert state["ROM-A"]["confirmed_status"] == LOW
    assert state["ROM-A"]["candidate_status"] is None

    # Cycle 5: Stays 18 (window [3, 18, 18] has median 18) -> candidate Padat (count 1)
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=160.0)
    assert state["ROM-A"]["confirmed_status"] == LOW
    assert state["ROM-A"]["candidate_status"] == FULL
    assert state["ROM-A"]["candidate_count"] == 1

    # Cycle 6: Stays 18 (window [18, 18, 18] has median 18) -> confirms Padat
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=175.0)
    assert state["ROM-A"]["confirmed_status"] == FULL


# ── Scenario 10: Perubahan Menetap (Berwaktu) ──────────────────────────────────
def test_scenario_10_perubahan_menetap():
    """10. Perubahan menetap (berwaktu): A dari 3 ke 18 -> status terkonfirmasi Padat pada siklus ketiga
    setelah sampel baru pertama (sekitar 30 detik pada siklus 15 detik)."""
    rooms = [{"room_id": "ROM-A", "room_name": "A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo = MockRepo(rooms)
    cfg = DslbConfig(confirm_cycles=2, smoothing_window=3)
    state = {}

    for _ in range(3):
        repo.set_counts({"ROM-A": 3})
        run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    assert state["ROM-A"]["confirmed_status"] == LOW

    # Step 1: count jumps to 18 -> classified LOW
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=115.0)
    assert state["ROM-A"]["confirmed_status"] == LOW

    # Step 2: count stays 18 -> classified FULL, candidate FULL (count 1)
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=130.0)
    assert state["ROM-A"]["confirmed_status"] == LOW
    assert state["ROM-A"]["candidate_status"] == FULL
    assert state["ROM-A"]["candidate_count"] == 1

    # Step 3: count stays 18 -> confirmed FULL
    repo.set_counts({"ROM-A": 18})
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=145.0)
    assert state["ROM-A"]["confirmed_status"] == FULL


# ── Scenario 11: Melebihi Kapasitas ───────────────────────────────────────────
def test_scenario_11_melebihi_kapasitas():
    """11. Melebihi kapasitas: 26,3,8,10,0,2 -> A Padat, persen mentah 130, tampilan 100, kursi 0,
    log WARNING sekali. Rekomendasi A = [B, C, E]."""
    repo = MockRepo(get_seed_rooms())
    repo.set_counts({
        "ROM-s0000001": 26, "ROM-s0000002": 3, "ROM-s0000003": 8,
        "ROM-s0000004": 10, "ROM-s0000005": 0, "ROM-s0000006": 2
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-s0000001"]["status"] == FULL
    assert res["ROM-s0000001"]["occupancy_pct_raw"] == 130.0
    assert res["ROM-s0000001"]["available_seats"] == 0
    recos = [r["room_id"] for r in res["ROM-s0000001"]["recommendations"]]
    assert recos == ["ROM-s0000002", "ROM-s0000003", "ROM-s0000005"]


# ── Scenario 12: Pemulihan Setelah Basi (Berwaktu) ────────────────────────────
def test_scenario_12_pemulihan_setelah_basi():
    """12. Pemulihan setelah basi (berwaktu): B basi lalu pulih -> bacaan valid pertama langsung diadopsi
    tanpa siklus konfirmasi."""
    rooms = [{"room_id": "ROM-B", "room_name": "B", "capacity": 20, "is_simulated": True, "status": "ACTIVE"}]
    repo = MockRepo(rooms)
    cfg = DslbConfig(confirm_cycles=2, smoothing_window=3, stale_seconds=60)
    state = {}

    repo.set_counts({"ROM-B": 16}, age_seconds=5.0)
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    assert state["ROM-B"]["confirmed_status"] == FULL

    repo.set_room_age("ROM-B", age_seconds=75.0)
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=175.0)
    assert state["ROM-B"]["confirmed_status"] == UNAVAILABLE

    repo.set_counts({"ROM-B": 4}, age_seconds=2.0)
    run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=180.0)
    assert state["ROM-B"]["confirmed_status"] == LOW


# ── Scenario 13: Simulasi Dimatikan ───────────────────────────────────────────
def test_scenario_13_simulasi_dimatikan():
    """13. Simulasi dimatikan: asal ruangan nyata Padat, semua kandidat is_simulated, dengan
    DSLB_INCLUDE_SIMULATED=false -> rekomendasi kosong."""
    rooms = [
        {"room_id": "ROM-real", "room_name": "Real Room", "building": "Gedung A", "capacity": 20, "is_simulated": False, "status": "ACTIVE"},
        {"room_id": "ROM-s01", "room_name": "Sim 1", "building": "Gedung A", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
    ]
    repo = MockRepo(rooms)
    repo.set_counts({"ROM-s01": 2})
    store = OccupancyStore()
    store.record_count("CAM-real", 18)

    repo.fetch_active_camera_map = lambda: {"ROM-real": "CAM-real"}

    cfg = DslbConfig(include_simulated=False)
    state = {}

    snapshots = run_cycle(repo, store, state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-real"]["status"] == FULL
    assert res["ROM-real"]["recommendations"] == []


# ── Scenario 14: Gedung Tidak Diketahui ────────────────────────────────────────
def test_scenario_14_gedung_tidak_diketahui():
    """14. Gedung tidak diketahui: asal X (building NULL, kap 20, 18 orang); kandidat P (G1, kap 20, 5 orang),
    Q (G2, kap 20, 2 orang), R (NULL, kap 20, 1 orang) -> urutan [R 5%, Q 10%, P 25%];
    ketiga kandidat beralasan 'gedung tidak diketahui' karena gedung asal tidak diketahui."""
    rooms = [
        {"room_id": "ROM-X", "room_name": "X", "building": None, "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-P", "room_name": "P", "building": "G1", "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-Q", "room_name": "Q", "building": "G2", "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
        {"room_id": "ROM-R", "room_name": "R", "building": None, "floor": "1", "capacity": 20, "is_simulated": True, "status": "ACTIVE"},
    ]
    repo = MockRepo(rooms)
    repo.set_counts({
        "ROM-X": 18, "ROM-P": 5, "ROM-Q": 2, "ROM-R": 1
    })
    cfg = DslbConfig()
    state = {}

    snapshots = run_cycle(repo, OccupancyStore(), state, cfg, now_monotonic=100.0)
    res = {s["room_id"]: s for s in snapshots}

    assert res["ROM-X"]["status"] == FULL
    recos = res["ROM-X"]["recommendations"]
    reco_ids = [r["room_id"] for r in recos]
    assert reco_ids == ["ROM-R", "ROM-Q", "ROM-P"]

    # All three have reason 'gedung tidak diketahui' because origin building is None
    for r in recos:
        assert "gedung tidak diketahui" in r["reason"].lower()
