import importlib.util
from pathlib import Path
import numpy as np
import pytest

# Load eval_replay module dynamically without network/db side effects
service_ai_dir = Path(__file__).resolve().parent.parent.parent
eval_replay_path = service_ai_dir / "scripts" / "eval_replay.py"
spec = importlib.util.spec_from_file_location("eval_replay", str(eval_replay_path))
eval_replay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eval_replay)


# ==============================================================================
# 1. Parsing Poligon ROI dan Ref Size
# ==============================================================================

def test_parse_roi_poly():
    """Parsing string koordinat piksel poligon."""
    poly_str = "75,255;520,255;560,272;704,272;704,576;70,576"
    pts = eval_replay.parse_roi_poly(poly_str)
    assert len(pts) == 6
    assert pts[0] == (75.0, 255.0)
    assert pts[-1] == (70.0, 576.0)

    with pytest.raises(ValueError, match="tidak boleh kosong"):
        eval_replay.parse_roi_poly("")

    with pytest.raises(ValueError, match="minimal harus memiliki 3 titik"):
        eval_replay.parse_roi_poly("10,10;20,20")


def test_parse_roi_ref_size():
    """Parsing string ukuran referensi 'WxH'."""
    assert eval_replay.parse_roi_ref_size("704x576") == (704, 576)
    assert eval_replay.parse_roi_ref_size(None) is None
    assert eval_replay.parse_roi_ref_size("") is None

    with pytest.raises(ValueError, match="Ukuran ref size tidak valid"):
        eval_replay.parse_roi_ref_size("704-576")


# ==============================================================================
# 2. Gambar Berukuran Referensi Memakai ROI, Berukuran Lain Melewatinya
# ==============================================================================

def test_roi_ref_size_matching_and_skipping():
    """Gambar berukuran referensi memakai ROI; gambar berukuran lain melewati roi/roi_tepi."""
    poly_pts = eval_replay.parse_roi_poly(eval_replay.DEFAULT_ROI_POLY)
    poly = np.array(poly_pts, dtype=np.float32)
    ref_size = (704, 576)
    active_rules = ["roi", "roi_tepi", "frame_penuh"]

    boxes = [
        (100.0, 300.0, 200.0, 400.0),  # Di dalam poly
        (10.0, 10.0, 50.0, 50.0),      # Di luar poly
    ]

    # Kasus 1: Gambar berukuran persis referensi (704x576) -> memakai ROI
    res_matching = eval_replay.evaluate_image_rules(
        boxes=boxes,
        img_width=704,
        img_height=576,
        polygon=poly,
        ref_size=ref_size,
        active_rules=active_rules,
        edge=3.0,
    )
    assert res_matching["frame_penuh"] == 2
    assert res_matching["roi"] == 1
    assert res_matching["roi_tepi"] == 1

    # Kasus 2: Gambar berukuran lain (misal 1280x720) -> roi dan roi_tepi dilewati (None)
    res_different = eval_replay.evaluate_image_rules(
        boxes=boxes,
        img_width=1280,
        img_height=720,
        polygon=poly,
        ref_size=ref_size,
        active_rules=active_rules,
        edge=3.0,
    )
    assert res_different["frame_penuh"] == 2
    assert res_different["roi"] is None
    assert res_different["roi_tepi"] is None


def test_evaluate_image_rules_frame_penuh_only():
    """Jika active_rules hanya frame_penuh, hanya frame_penuh yang dihitung."""
    poly_pts = eval_replay.parse_roi_poly(eval_replay.DEFAULT_ROI_POLY)
    poly = np.array(poly_pts, dtype=np.float32)
    ref_size = (704, 576)

    boxes = [(100.0, 300.0, 200.0, 400.0)]
    res = eval_replay.evaluate_image_rules(
        boxes=boxes,
        img_width=1920,
        img_height=1080,
        polygon=poly,
        ref_size=ref_size,
        active_rules=["frame_penuh"],
        edge=3.0,
    )
    assert res["frame_penuh"] == 1
    assert "roi" not in res
    assert "roi_tepi" not in res


# ==============================================================================
# 3. Titik Kaki: Di Dalam, Di Luar, dan Tepat di Batas Poligon
# ==============================================================================

def test_foot_point_inside_outside_and_on_boundary():
    """Titik kaki ((x1+x2)/2, y2) diuji terhadap batas poligon (cv2.pointPolygonTest >= 0)."""
    poly_pts = eval_replay.parse_roi_poly(eval_replay.DEFAULT_ROI_POLY)
    poly = np.array(poly_pts, dtype=np.float32)

    # Kotak A: titik kaki (250, 400) jelas berada di DALAM poligon
    box_inside = (200.0, 300.0, 300.0, 400.0)

    # Kotak B: titik kaki (30, 50) jelas berada di LUAR poligon (di atas area ROI)
    box_outside = (10.0, 10.0, 50.0, 50.0)

    # Kotak C: titik kaki (75, 255) tepat di vertex batas atas-kiri poligon
    box_vertex = (70.0, 200.0, 80.0, 255.0)

    # Kotak D: titik kaki (200, 255) tepat di garis segmen batas atas y=255 (antara x=75 dan 520)
    box_edge_line = (190.0, 200.0, 210.0, 255.0)

    counts = eval_replay.count_boxes_under_rules(
        boxes=[box_inside, box_outside, box_vertex, box_edge_line],
        polygon=poly,
        width=704,
        edge=3.0,
    )

    # frame_penuh menghitung semua 4 kotak
    assert counts["frame_penuh"] == 4
    # roi menghitung kotak di dalam (A) dan tepat di batas (C, D) = 3 kotak
    assert counts["roi"] == 3


# ==============================================================================
# 4. Aturan Tepi (roi_tepi)
# ==============================================================================

def test_roi_tepi_filtering():
    """Kotak dengan x1 <= edge atau x2 >= width - edge dibuang pada roi_tepi."""
    poly_pts = eval_replay.parse_roi_poly(eval_replay.DEFAULT_ROI_POLY)
    poly = np.array(poly_pts, dtype=np.float32)
    w = 704.0
    edge = 3.0

    # Kotak di tengah, aman (x1=100 > 3, x2=200 < 701, foot=150 in poly)
    box_safe = (100.0, 300.0, 200.0, 400.0)

    # Kotak tepi kiri: x1=2.0 <= 3.0, foot=(2+198)/2=100 in poly -> masuk roi, dibuang roi_tepi
    box_left_edge = (2.0, 300.0, 198.0, 400.0)

    # Kotak tepi kanan: x2=702.0 >= 701.0, foot=(550+702)/2=626 in poly -> masuk roi, dibuang roi_tepi
    box_right_edge = (550.0, 300.0, 702.0, 400.0)

    # Kotak tepat di batas tepi kiri: x1=3.0 <= 3.0, foot=100 in poly -> dibuang roi_tepi
    box_boundary_left = (3.0, 300.0, 197.0, 400.0)

    # Kotak tepat di batas tepi kanan: x2=701.0 >= 701.0, foot=625.5 in poly -> dibuang roi_tepi
    box_boundary_right = (550.0, 300.0, 701.0, 400.0)

    # Kotak tepat di dalam ambang batas: x1=3.1 > 3 dan x2=690.0 < 701, foot=346.55 in poly -> masuk roi_tepi
    box_just_inside = (3.1, 300.0, 690.0, 400.0)

    counts = eval_replay.count_boxes_under_rules(
        boxes=[box_safe, box_left_edge, box_right_edge, box_boundary_left, box_boundary_right, box_just_inside],
        polygon=poly,
        width=w,
        edge=edge,
    )

    # Di roi biasa, semua 6 kotak lolos karena titik kakinya berada di dalam poligon
    assert counts["roi"] == 6
    # Di roi_tepi, box_left_edge, box_right_edge, box_boundary_left, box_boundary_right dibuang
    # Tersisa box_safe dan box_just_inside = 2 kotak
    assert counts["roi_tepi"] == 2


# ==============================================================================
# 5. Metrik Baseline Konstan
# ==============================================================================

def test_constant_baseline_metric():
    """Perhitungan MAE terkecil dari tebakan konstan c dalam range(4)."""
    # Kasus c=0 optimal: gt=[0, 0, 0, 1]
    # c=0 -> MAE = 1/4 = 0.25; c=1 -> MAE = 3/4 = 0.75
    best_c, min_mae = eval_replay.compute_constant_baseline_mae([0, 0, 0, 1])
    assert best_c == 0
    assert min_mae == pytest.approx(0.25)

    # Kasus c=1 optimal: gt=[1, 1, 1, 2]
    # c=1 -> MAE = 1/4 = 0.25; c=0 -> MAE = 5/4 = 1.25
    best_c, min_mae = eval_replay.compute_constant_baseline_mae([1, 1, 1, 2])
    assert best_c == 1
    assert min_mae == pytest.approx(0.25)

    # Kasus c=2 optimal: gt=[2, 2, 2, 1]
    best_c, min_mae = eval_replay.compute_constant_baseline_mae([2, 2, 2, 1])
    assert best_c == 2
    assert min_mae == pytest.approx(0.25)

    # Kasus c=3 optimal: gt=[3, 3, 3, 2]
    best_c, min_mae = eval_replay.compute_constant_baseline_mae([3, 3, 3, 2])
    assert best_c == 3
    assert min_mae == pytest.approx(0.25)


# ==============================================================================
# 6. Metrik FP_kosong, n_kosong, dan Toleransi +-1
# ==============================================================================

def test_compute_metrics_fp_empty_and_n_empty():
    """Metrik FP_kosong (%) beserta jumlah frame kosong (n_kosong)."""
    gt = [0, 0, 0, 5]
    pred = [1, 0, 2, 5]

    m = eval_replay.compute_metrics(gt, pred)
    assert m["n_empty"] == 3
    assert m["fp_empty_count"] == 2
    assert m["fp_empty_pct"] == pytest.approx(66.6666, rel=1e-2)
    assert m["n_occupied"] == 1
    assert m["miss_rate_count"] == 0
    assert m["miss_rate_pct"] == pytest.approx(0.0)


def test_compute_metrics_perfect():
    """gt=[0, 1, 2], pred=[0, 1, 2] -> MAE 0, bias 0, persis 100%."""
    m = eval_replay.compute_metrics([0, 1, 2], [0, 1, 2])
    assert m["mae"] == pytest.approx(0.0)
    assert m["bias"] == pytest.approx(0.0)
    assert m["exact_pct"] == pytest.approx(100.0)
    assert m["pm1_pct"] == pytest.approx(100.0)


def test_compute_metrics_miss_rate():
    """gt=[2, 3], pred=[0, 0] -> Miss rate = 100%."""
    m = eval_replay.compute_metrics([2, 3], [0, 0])
    assert m["miss_rate_pct"] == pytest.approx(100.0)
    assert m["exact_pct"] == pytest.approx(0.0)


def test_compute_metrics_pm1_tolerance():
    """Toleransi +-1: gt=[5], pred=[4] -> masuk; pred=[3] -> tidak masuk."""
    m_in = eval_replay.compute_metrics([5], [4])
    assert m_in["pm1_pct"] == pytest.approx(100.0)
    m_out = eval_replay.compute_metrics([5], [3])
    assert m_out["pm1_pct"] == pytest.approx(0.0)


# ==============================================================================
# 7. Parsing Label YOLO TXT ke Kotak Piksel
# ==============================================================================

def test_parse_yolo_label_boxes_empty_and_missing(tmp_path):
    """Berkas kosong menghasilkan list kosong; berkas hilang ditangani sesuai assume_empty."""
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("", encoding="utf-8")
    assert eval_replay.parse_yolo_label_boxes(empty_file, 100, 200) == []

    missing = tmp_path / "missing.txt"
    assert eval_replay.parse_yolo_label_boxes(missing, 100, 200, assume_empty=True) == []
    with pytest.raises(FileNotFoundError):
        eval_replay.parse_yolo_label_boxes(missing, 100, 200, assume_empty=False)


def test_parse_yolo_label_boxes_multi_class_and_irregular(tmp_path):
    """Filter kelas dan penanganan baris kosong / komentar."""
    label_file = tmp_path / "sample.txt"
    content = (
        "\n"
        "# Komentar\n"
        "0 0.5 0.5 0.2 0.4\n"
        "56 0.1 0.1 0.1 0.1\n"  # Kelas lain bukan orang
        "invalid token line\n"
    )
    label_file.write_text(content, encoding="utf-8")

    boxes = eval_replay.parse_yolo_label_boxes(label_file, width=100, height=200, person_classes=[0])
    assert len(boxes) == 1
    x1, y1, x2, y2 = boxes[0]
    assert (x1, y1, x2, y2) == pytest.approx((40.0, 60.0, 60.0, 140.0))


# ==============================================================================
# 8. Logika Fallback C1 dan Pemetaan C2 - C5
# ==============================================================================

class MockBox:
    def __init__(self, xyxy):
        self.xyxy = [xyxy]


class MockResult:
    def __init__(self, boxes):
        self.boxes = [MockBox(b) for b in boxes]


class MockModel:
    def __init__(self, return_boxes: list):
        self.return_boxes = return_boxes
        self.call_count = 0
        self.last_kwargs = None

    def predict(self, frame, **kwargs):
        self.call_count += 1
        self.last_kwargs = kwargs
        return [MockResult(self.return_boxes)]


class SpyModel:
    def __init__(self, name: str):
        self.name = name
        self.call_count = 0
        self.last_frame = None
        self.last_kwargs = None

    def predict(self, frame, **kwargs):
        self.call_count += 1
        self.last_frame = frame
        self.last_kwargs = kwargs
        return [MockResult([])]


def test_c1_primary_returns_boxes_fallback_not_called():
    """Jika primary mengembalikan kotak: fallback TIDAK dipanggil, hasil = primary."""
    primary = MockModel([[10, 10, 50, 50]])
    fallback = MockModel([[20, 20, 60, 60]])

    results, triggered = eval_replay.run_c1_pipeline(
        frame=None,
        primary_model=primary,
        fallback_model=fallback,
        conf=0.3,
        iou=0.45,
        no_primary=False,
    )
    assert primary.call_count == 1
    assert fallback.call_count == 0
    assert triggered is False
    assert len(results[0].boxes) == 1


def test_c1_primary_returns_empty_fallback_called():
    """Jika primary mengembalikan 0 kotak: fallback DIPANGGIL dan MENGGANTIKAN hasil primary."""
    primary = MockModel([])
    fallback = MockModel([[20, 20, 60, 60]])

    results, triggered = eval_replay.run_c1_pipeline(
        frame=None,
        primary_model=primary,
        fallback_model=fallback,
        conf=0.3,
        iou=0.45,
        no_primary=False,
    )
    assert primary.call_count == 1
    assert fallback.call_count == 1
    assert triggered is True
    assert len(results[0].boxes) == 1
    assert results[0].boxes[0].xyxy[0] == [20, 20, 60, 60]


def test_c1_no_primary_mode():
    """Jika no_primary diaktifkan: primary TIDAK dipanggil, fallback DIPANGGIL untuk SEMUA frame."""
    primary = MockModel([[10, 10, 50, 50]])
    fallback = MockModel([[20, 20, 60, 60]])

    results, triggered = eval_replay.run_c1_pipeline(
        frame=None,
        primary_model=primary,
        fallback_model=fallback,
        conf=0.3,
        iou=0.45,
        no_primary=True,
    )
    assert primary.call_count == 0
    assert fallback.call_count == 1
    assert triggered is True


def test_run_config_predict_mapping_and_kwargs():
    """Memverifikasi bahwa tiap label konfigurasi (C1-C5) memanggil model dan argumen yang diklaim:
    - C2: S0 pada parameter terpasang (conf dan iou dari env, imgsz tidak dikirim, tanpa fallback)
    - C3: S1 pada parameter terpasang (conf dan iou dari env, imgsz tidak dikirim, tanpa fallback)
    - C4: S1 pada parameter evaluasi (--eval-conf, --eval-imgsz, --eval-iou)
    - C5: S0 pada parameter evaluasi (--eval-conf, --eval-imgsz, --eval-iou)
    - C1: primary s0 + fallback best pada parameter terpasang
    """
    s0 = SpyModel("s0")
    s1 = SpyModel("s1")
    best = SpyModel("best")
    loaded = {"s0": s0, "s1": s1, "best": best}

    env_conf = 0.50
    env_iou = 0.45
    eval_conf = 0.25
    eval_imgsz = 960
    eval_iou = 0.70

    # 1. C2: harus memanggil s0 dengan parameter terpasang, tanpa imgsz
    s0.call_count = 0
    s1.call_count = 0
    res, trig = eval_replay.run_config_predict(
        cfg="C2",
        frame="frame_c2",
        loaded_models=loaded,
        env_conf=env_conf,
        env_iou=env_iou,
        eval_conf=eval_conf,
        eval_imgsz=eval_imgsz,
        eval_iou=eval_iou,
    )
    assert s0.call_count == 1
    assert s1.call_count == 0
    assert s0.last_kwargs["conf"] == env_conf
    assert s0.last_kwargs["iou"] == env_iou
    assert "imgsz" not in s0.last_kwargs
    assert trig is False

    # 2. C3: harus memanggil s1 dengan parameter terpasang, tanpa imgsz
    s0.call_count = 0
    s1.call_count = 0
    res, trig = eval_replay.run_config_predict(
        cfg="C3",
        frame="frame_c3",
        loaded_models=loaded,
        env_conf=env_conf,
        env_iou=env_iou,
        eval_conf=eval_conf,
        eval_imgsz=eval_imgsz,
        eval_iou=eval_iou,
    )
    assert s0.call_count == 0
    assert s1.call_count == 1
    assert s1.last_kwargs["conf"] == env_conf
    assert s1.last_kwargs["iou"] == env_iou
    assert "imgsz" not in s1.last_kwargs
    assert trig is False

    # 3. C4: harus memanggil s1 dengan parameter evaluasi (conf=0.25, imgsz=960, iou=0.70)
    s0.call_count = 0
    s1.call_count = 0
    res, trig = eval_replay.run_config_predict(
        cfg="C4",
        frame="frame_c4",
        loaded_models=loaded,
        env_conf=env_conf,
        env_iou=env_iou,
        eval_conf=eval_conf,
        eval_imgsz=eval_imgsz,
        eval_iou=eval_iou,
    )
    assert s0.call_count == 0
    assert s1.call_count == 1
    assert s1.last_kwargs["conf"] == eval_conf
    assert s1.last_kwargs["imgsz"] == eval_imgsz
    assert s1.last_kwargs["iou"] == eval_iou
    assert trig is False

    # 4. C5: harus memanggil s0 dengan parameter evaluasi (conf=0.25, imgsz=960, iou=0.70)
    s0.call_count = 0
    s1.call_count = 0
    res, trig = eval_replay.run_config_predict(
        cfg="C5",
        frame="frame_c5",
        loaded_models=loaded,
        env_conf=env_conf,
        env_iou=env_iou,
        eval_conf=eval_conf,
        eval_imgsz=eval_imgsz,
        eval_iou=eval_iou,
    )
    assert s0.call_count == 1
    assert s1.call_count == 0
    assert s0.last_kwargs["conf"] == eval_conf
    assert s0.last_kwargs["imgsz"] == eval_imgsz
    assert s0.last_kwargs["iou"] == eval_iou
    assert trig is False

    # 5. C1: primary s0 + fallback best
    s0.call_count = 0
    best.call_count = 0
    res, trig = eval_replay.run_config_predict(
        cfg="C1",
        frame="frame_c1",
        loaded_models=loaded,
        env_conf=env_conf,
        env_iou=env_iou,
        eval_conf=eval_conf,
        eval_imgsz=eval_imgsz,
        eval_iou=eval_iou,
    )
    assert s0.call_count == 1
    assert best.call_count == 1
    assert s0.last_kwargs["conf"] == env_conf
    assert s0.last_kwargs["iou"] == env_iou
    assert "imgsz" not in s0.last_kwargs
    assert trig is True


# ==============================================================================
# 9. Akurasi Status Ruangan, Matriks Konfusi, dan Fallback Contribution
# ==============================================================================

def test_classify_status_and_confusion_matrix():
    """Pengujian status dan matriks konfusi dengan dslb_core."""
    dslb_core = eval_replay.load_dslb_core(service_ai_dir)
    classify_status_fn = dslb_core.classify_status

    cap = 10
    gt = [0, 3, 5, 8]
    pred = [0, 3, 5, 8]
    res = eval_replay.compute_status_metrics(gt, pred, cap, classify_status_fn)
    assert res["accuracy_pct"] == pytest.approx(100.0)
    assert res["confusion_matrix"]["Kosong"]["Kosong"] == 1
    assert res["confusion_matrix"]["Padat"]["Padat"] == 1


def test_compute_fallback_contribution_per_rule():
    """Perhitungan kontribusi fallback pada rule."""
    stats = eval_replay.compute_fallback_contribution(
        gt_counts=[0, 1, 0],
        c1_counts=[0, 1, 2],
        c1_triggered_fallback=[True, True, True],
    )
    assert stats["total_frames"] == 3
    assert stats["triggered_count"] == 3
    assert stats["found_person_count"] == 2
    assert stats["true_positive_count"] == 1
    assert stats["false_positive_count"] == 1


# ==============================================================================
# 10. Laporan Markdown
# ==============================================================================

def test_generate_summary_markdown_per_rule():
    """Memastikan summary.md berisi tabel dan bagian fallback per aturan aktif."""
    meta = {
        "name": "test_run",
        "timestamp": "2026-11-08 00:00:00",
        "device": "cpu",
        "num_images": 5,
        "roi_poly_str": eval_replay.DEFAULT_ROI_POLY,
        "roi_ref_size_str": "704x576",
        "edge": 3.0,
        "models": {
            "s0": {"path": "yolov8n.pt", "sha256": "dummy_s0"},
            "best": {"path": "app/models/best.pt", "sha256": "dummy_best"},
        },
        "env_model_path": "yolov8n.pt",
        "env_conf": 0.5,
        "env_iou": 0.45,
    }

    active_rules = ["roi", "roi_tepi", "frame_penuh"]
    metrics_by_rule_cfg = {
        r: {
            "C1": eval_replay.compute_metrics([0, 1], [0, 1]),
            "C2": eval_replay.compute_metrics([0, 1], [1, 1]),
        }
        for r in active_rules
    }

    dslb_core = eval_replay.load_dslb_core(service_ai_dir)
    status_metrics = {
        10: {
            "C1": eval_replay.compute_status_metrics([0, 1], [0, 1], 10, dslb_core.classify_status),
            "C2": eval_replay.compute_status_metrics([0, 1], [1, 1], 10, dslb_core.classify_status),
        }
    }

    fallback_by_rule = {
        r: eval_replay.compute_fallback_contribution([0, 1], [0, 1], [True, False])
        for r in active_rules
    }

    predict_specs = {
        "C1": {
            "desc": "Pipeline terpasang (s0 primary + best fallback)",
            "model": "s0 + best",
            "sha256": "s0: dummy_s0<br>best: dummy_best",
            "conf": "0.50",
            "iou": "0.45",
            "imgsz": "default",
        },
        "C2": {
            "desc": "S0 parameter terpasang (tanpa fallback)",
            "model": "s0",
            "sha256": "dummy_s0",
            "conf": "0.50",
            "iou": "0.45",
            "imgsz": "default",
        },
    }

    md = eval_replay.generate_summary_markdown(
        meta=meta,
        metrics_by_rule_cfg=metrics_by_rule_cfg,
        status_metrics_by_cap=status_metrics,
        fallback_by_rule=fallback_by_rule,
        active_configs=["C1", "C2"],
        active_rules=active_rules,
        capacities=[10],
        status_rule="frame_penuh",
        skipped_roi_count=2,
        predict_specs=predict_specs,
    )

    for r in active_rules:
        assert f"### Aturan: `{r}`" in md
        assert f"#### Kontribusi Fallback pada C1 (`{r}`)" in md
        assert "Baseline Konstan Terkecil" in md
        assert "Jumlah Frame Kosong ($n_{kosong}$)" in md

    assert "## Argumen Predict dan Hash Bobot per Konfigurasi" in md
    assert "dummy_s0" in md
    assert "dilewati: ukuran gambar berbeda dari referensi" in md
    assert "## Akurasi Status Ruangan per Kapasitas (Aturan: `frame_penuh`)" in md
