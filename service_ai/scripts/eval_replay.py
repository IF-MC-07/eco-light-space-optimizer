#!/usr/bin/env python3
"""Offline inference replay and evaluation tool.

Perbedaan resolusi path:
Di inference_realtime.py, path bobot (MODEL_PATH, fallback_path) diselesaikan relatif
terhadap CWD proses (misal os.getenv('MODEL_PATH', 'yolov8n.pt') dan 'app/models/best.pt').
Di eval_replay.py, path diselesaikan relatif terhadap direktori service_ai/
(induk dari scripts/) agar skrip dapat dipanggil dari direktori mana pun tanpa bergantung pada CWD.

Pemetaan Konfigurasi Resmi:
- C1: Pipeline terpasang (s0 primary + best fallback, conf/iou dari service_ai/.env, imgsz default)
- C2: S0 pada parameter terpasang (conf/iou dari service_ai/.env, imgsz tidak dikirim, tanpa fallback)
- C3: S1 pada parameter terpasang (conf/iou dari service_ai/.env, imgsz tidak dikirim, tanpa fallback)
- C4: S1 pada parameter evaluasi (--eval-conf, --eval-imgsz, --eval-iou)
- C5: S0 pada parameter evaluasi (--eval-conf, --eval-imgsz, --eval-iou)

Aturan hitungan (--rules):
- frame_penuh: semua kotak dihitung (seperti hitung_per_zona tanpa filter).
- roi: kotak dihitung bila titik kaki ((x1+x2)/2, y2) berada di dalam atau pada batas poligon.
- roi_tepi: seperti roi, tetapi kotak dengan x1 <= edge atau x2 >= W - edge dibuang (edge default 3).

Catatan ROI & Ukuran Referensi:
Poligon ROI HANYA berlaku untuk gambar berukuran persis --roi-ref-size (default 704x576).
Poligon TIDAK diskalakan proporsional. Jika ukuran gambar berbeda dari referensi,
aturan roi dan roi_tepi dilewati untuk gambar tersebut dan dicatat di summary.md,
sedangkan aturan frame_penuh tetap dihitung.
"""

from __future__ import annotations

import argparse
import csv
import datetime
import hashlib
import importlib.util
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple


DEFAULT_ROI_POLY = "75,255;520,255;560,272;704,272;704,576;70,576"
DEFAULT_ROI_REF_SIZE = "704x576"
DEFAULT_EDGE = 3.0
ALL_AVAILABLE_RULES = ["roi", "roi_tepi", "frame_penuh"]


# ==============================================================================
# Helper Pemuatan dslb_core
# ==============================================================================

def load_dslb_core(service_ai_dir: Path):
    """Memuat modul dslb_core secara murni tanpa efek samping."""
    core_path = service_ai_dir / "app" / "dslb_core.py"
    if not core_path.is_file():
        raise FileNotFoundError(f"dslb_core.py tidak ditemukan di: {core_path}")
    spec = importlib.util.spec_from_file_location("dslb_core", str(core_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"Tidak dapat membuat spec untuk {core_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ==============================================================================
# Pembacaan Konfigurasi .env Terbatas
# ==============================================================================

def read_env_config(service_ai_dir: Path) -> Dict[str, Any]:
    """Membaca HANYA MODEL_PATH, CONF_THRESHOLD, dan IOU_THRESHOLD dari service_ai/.env."""
    env_path = service_ai_dir / ".env"
    raw_vals: Dict[str, Optional[str]] = {}
    if env_path.is_file():
        try:
            from dotenv import dotenv_values
            raw = dotenv_values(env_path)
            raw_vals["MODEL_PATH"] = raw.get("MODEL_PATH")
            raw_vals["CONF_THRESHOLD"] = raw.get("CONF_THRESHOLD")
            raw_vals["IOU_THRESHOLD"] = raw.get("IOU_THRESHOLD")
        except Exception:
            pass

    # Default fallback sesuai inference_realtime.py (baris 45-47: CONF 0.30, IOU 0.45, MODEL yolov8n.pt)
    conf = 0.30
    iou = 0.45
    model_path = "yolov8n.pt"

    if raw_vals.get("CONF_THRESHOLD") is not None:
        try:
            conf = float(raw_vals["CONF_THRESHOLD"])  # type: ignore
        except (ValueError, TypeError):
            pass

    if raw_vals.get("IOU_THRESHOLD") is not None:
        try:
            iou = float(raw_vals["IOU_THRESHOLD"])  # type: ignore
        except (ValueError, TypeError):
            pass

    if raw_vals.get("MODEL_PATH"):
        model_path = str(raw_vals["MODEL_PATH"])

    return {
        "model_path": model_path,
        "conf": conf,
        "iou": iou,
        "raw": raw_vals,
    }


# ==============================================================================
# Utilitas File dan Bobot
# ==============================================================================

def resolve_service_ai_path(path_str: str, service_ai_dir: Path) -> Path:
    """Menyelesaikan path relatif terhadap service_ai_dir, atau absolute jika sudah absolute."""
    p = Path(path_str)
    if not p.is_absolute():
        p = (service_ai_dir / p).resolve()
    return p


def calculate_sha256(file_path: Path) -> str:
    """Menghitung SHA256 dari sebuah file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def resolve_device(device_arg: str) -> str:
    """Menentukan perangkat inferensi (auto: cuda -> mps -> cpu)."""
    if device_arg.lower() != "auto":
        return device_arg
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"


# ==============================================================================
# Parsing Poligon ROI dan Filter Aturan Hitungan (Tanpa Skala)
# ==============================================================================

def parse_roi_poly(poly_str: str) -> List[Tuple[float, float]]:
    """Mem-parse string 'x,y;x,y;...' menjadi daftar tuple titik (float(x), float(y))."""
    if not poly_str or not poly_str.strip():
        raise ValueError("String poligon ROI tidak boleh kosong")
    pts = []
    pairs = poly_str.strip().split(";")
    for p in pairs:
        p = p.strip()
        if not p:
            continue
        parts = p.split(",")
        if len(parts) != 2:
            raise ValueError(f"Titik poligon tidak valid: '{p}'. Format harus 'x,y'")
        pts.append((float(parts[0].strip()), float(parts[1].strip())))
    if len(pts) < 3:
        raise ValueError("Poligon ROI minimal harus memiliki 3 titik")
    return pts


def parse_roi_ref_size(ref_size_str: Optional[str]) -> Optional[Tuple[int, int]]:
    """Mem-parse string ukuran referensi 'WxH' (misal '704x576') menjadi (w, h)."""
    if not ref_size_str or not ref_size_str.strip():
        return None
    s = ref_size_str.strip().lower()
    parts = s.split("x")
    if len(parts) != 2:
        raise ValueError(
            f"Ukuran ref size tidak valid: '{ref_size_str}'. Format harus 'WxH' (misal '704x576')"
        )
    return int(parts[0].strip()), int(parts[1].strip())


def count_boxes_under_rules(
    boxes: Sequence[Tuple[float, float, float, float]],
    polygon: Any,
    width: float,
    edge: float = DEFAULT_EDGE,
) -> Dict[str, int]:
    """Menghitung jumlah kotak deteksi/label di bawah 3 aturan:

    1. frame_penuh: semua kotak dihitung.
    2. roi: kotak dihitung bila titik kaki ((x1+x2)/2, y2) berada di dalam atau pada batas poligon.
    3. roi_tepi: seperti roi, tetapi kotak dengan x1 <= edge atau x2 >= width - edge dibuang.
    """
    import cv2

    cnt_frame_penuh = len(boxes)
    cnt_roi = 0
    cnt_roi_tepi = 0

    for box in boxes:
        x1, y1, x2, y2 = box
        foot_pt = ((x1 + x2) / 2.0, float(y2))
        dist = cv2.pointPolygonTest(polygon, foot_pt, True)
        is_in_poly = dist >= 0.0

        if is_in_poly:
            cnt_roi += 1
            if not (x1 <= edge or x2 >= width - edge):
                cnt_roi_tepi += 1

    return {
        "frame_penuh": cnt_frame_penuh,
        "roi": cnt_roi,
        "roi_tepi": cnt_roi_tepi,
    }


def evaluate_image_rules(
    boxes: Sequence[Tuple[float, float, float, float]],
    img_width: int,
    img_height: int,
    polygon: Any,
    ref_size: Optional[Tuple[int, int]],
    active_rules: Sequence[str],
    edge: float = DEFAULT_EDGE,
) -> Dict[str, Optional[int]]:
    """Menghitung jumlah kotak untuk aturan yang aktif.

    Poligon ROI HANYA berlaku untuk gambar yang berukuran persis ref_size.
    Jika ukuran gambar berbeda dari ref_size, aturan 'roi' dan 'roi_tepi' dilewati (bernilai None).
    Aturan 'frame_penuh' tetap dihitung bila aktif.
    """
    res: Dict[str, Optional[int]] = {r: None for r in active_rules}
    matches_ref = (ref_size is not None and (img_width, img_height) == ref_size)

    if "frame_penuh" in active_rules:
        res["frame_penuh"] = len(boxes)

    if matches_ref:
        poly_counts = count_boxes_under_rules(boxes, polygon, width=float(img_width), edge=edge)
        if "roi" in active_rules:
            res["roi"] = poly_counts["roi"]
        if "roi_tepi" in active_rules:
            res["roi_tepi"] = poly_counts["roi_tepi"]

    return res


def parse_yolo_label_boxes(
    label_path: Path,
    width: float,
    height: float,
    person_classes: Sequence[int] = (0,),
    assume_empty: bool = False,
) -> List[Tuple[float, float, float, float]]:
    """Membaca label YOLO TXT dan mengonversinya ke kotak piksel [x1, y1, x2, y2]."""
    if not label_path.is_file():
        if assume_empty:
            return []
        raise FileNotFoundError(f"File label tidak ditemukan: {label_path}")

    person_set = set(person_classes)
    boxes: List[Tuple[float, float, float, float]] = []
    with open(label_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            tokens = line.split()
            if len(tokens) < 5:
                continue
            try:
                cls_id = int(tokens[0])
                cx = float(tokens[1])
                cy = float(tokens[2])
                w = float(tokens[3])
                h = float(tokens[4])
            except ValueError:
                continue

            if cls_id in person_set:
                x1 = (cx - w / 2.0) * width
                y1 = (cy - h / 2.0) * height
                x2 = (cx + w / 2.0) * width
                y2 = (cy + h / 2.0) * height
                boxes.append((x1, y1, x2, y2))
    return boxes


def extract_pred_boxes(boxes: Any) -> List[Tuple[float, float, float, float]]:
    """Mengekstrak koordinat piksel [x1, y1, x2, y2] dari hasil deteksi YOLO."""
    if boxes is None or len(boxes) == 0:
        return []
    res: List[Tuple[float, float, float, float]] = []
    for box in boxes:
        x1, y1, x2, y2 = map(float, box.xyxy[0])
        res.append((x1, y1, x2, y2))
    return res


# ==============================================================================
# Pipeline Inferensi C1 dan Pemetaan C2 - C5
# ==============================================================================

def run_c1_pipeline(
    frame: Any,
    primary_model: Any,
    fallback_model: Any,
    conf: float,
    iou: float,
    no_primary: bool = False,
    person_classes: Sequence[int] = (0,),
    device: Optional[str] = None,
) -> Tuple[Any, bool]:
    """Meniru logika inferensi camera_worker dari service_ai/app/inference_realtime.py:

    1. Coba deteksi menggunakan model Primary
    2. Jika Primary gagal mendeteksi orang (kosong) atau tidak dimuat, gunakan Fallback
    Hasil fallback MENGGANTIKAN hasil primary (tidak digabung).

    Mengembalikan (results, triggered_fallback).
    """
    predict_kwargs: Dict[str, Any] = {
        "conf": conf,
        "iou": iou,
        "classes": list(person_classes),
        "verbose": False,
        "save": False,
        "save_txt": False,
    }
    if device is not None:
        predict_kwargs["device"] = device

    results = None
    triggered_fallback = False

    # 1. Coba deteksi menggunakan model Primary
    if not no_primary and primary_model is not None:
        results = primary_model.predict(frame, **predict_kwargs)

    # 2. Jika Primary gagal mendeteksi orang (kosong/None), gunakan Fallback
    if fallback_model is not None:
        if results is None or len(results[0].boxes) == 0:
            triggered_fallback = True
            results = fallback_model.predict(frame, **predict_kwargs)

    return results, triggered_fallback


def run_config_predict(
    cfg: str,
    frame: Any,
    loaded_models: Dict[str, Any],
    env_conf: float,
    env_iou: float,
    eval_conf: float,
    eval_imgsz: int,
    eval_iou: Optional[float] = 0.7,
    person_classes: Sequence[int] = (0,),
    device: Optional[str] = None,
    no_primary: bool = False,
) -> Tuple[Any, bool]:
    """Menjalankan inferensi untuk konfigurasi C1-C5 sesuai pemetaan resmi:

    - C1: s0 (primary) + best (fallback), conf & iou dari service_ai/.env, imgsz default
    - C2: s0 parameter terpasang (conf & iou dari service_ai/.env, imgsz tidak dikirim, tanpa fallback)
    - C3: s1 parameter terpasang (conf & iou dari service_ai/.env, imgsz tidak dikirim, tanpa fallback)
    - C4: s1 parameter evaluasi (conf=eval_conf, imgsz=eval_imgsz, iou=eval_iou)
    - C5: s0 parameter evaluasi (conf=eval_conf, imgsz=eval_imgsz, iou=eval_iou)

    Mengembalikan (results, triggered_fallback).
    """
    if cfg == "C1":
        return run_c1_pipeline(
            frame=frame,
            primary_model=loaded_models.get("s0"),
            fallback_model=loaded_models.get("best"),
            conf=env_conf,
            iou=env_iou,
            no_primary=no_primary,
            person_classes=person_classes,
            device=device,
        )

    base_kwargs: Dict[str, Any] = {
        "classes": list(person_classes),
        "verbose": False,
        "save": False,
        "save_txt": False,
    }
    if device is not None:
        base_kwargs["device"] = device

    if cfg == "C2":
        # S0 pada parameter terpasang (imgsz tidak dikirim, tanpa fallback)
        kwargs = dict(base_kwargs, conf=env_conf, iou=env_iou)
        res = loaded_models["s0"].predict(frame, **kwargs)
        return res, False

    elif cfg == "C3":
        # S1 pada parameter terpasang (imgsz tidak dikirim, tanpa fallback)
        kwargs = dict(base_kwargs, conf=env_conf, iou=env_iou)
        res = loaded_models["s1"].predict(frame, **kwargs)
        return res, False

    elif cfg == "C4":
        # S1 pada parameter evaluasi
        kwargs = dict(base_kwargs, conf=eval_conf, imgsz=eval_imgsz)
        if eval_iou is not None:
            kwargs["iou"] = eval_iou
        res = loaded_models["s1"].predict(frame, **kwargs)
        return res, False

    elif cfg == "C5":
        # S0 pada parameter evaluasi
        kwargs = dict(base_kwargs, conf=eval_conf, imgsz=eval_imgsz)
        if eval_iou is not None:
            kwargs["iou"] = eval_iou
        res = loaded_models["s0"].predict(frame, **kwargs)
        return res, False

    else:
        raise ValueError(f"Konfigurasi tidak dikenal: '{cfg}'")


# ==============================================================================
# Perhitungan Metrik Evaluasi & Baseline Konstan
# ==============================================================================

def compute_constant_baseline_mae(gt_counts: Sequence[int]) -> Tuple[int, float]:
    """Menghitung c in range(4) yang menghasilkan MAE terkecil terhadap gt_counts."""
    if not gt_counts:
        return 0, 0.0
    n = len(gt_counts)
    best_c = 0
    min_mae = float("inf")
    for c in range(4):
        mae = sum(abs(g - c) for g in gt_counts) / n
        if mae < min_mae:
            min_mae = mae
            best_c = c
    return best_c, min_mae


def compute_metrics(
    gt_counts: Sequence[int],
    pred_counts: Sequence[int],
    latencies_ms: Optional[Sequence[float]] = None,
) -> Dict[str, Any]:
    """Menghitung metrik hitungan orang: MAE, Bias, Akurasi persis, +-1, FP kosong, Miss rate, latensi, konstan."""
    n = len(gt_counts)
    if n == 0:
        return {
            "n": 0,
            "mae": 0.0,
            "bias": 0.0,
            "exact_pct": 0.0,
            "pm1_pct": 0.0,
            "n_empty": 0,
            "fp_empty_count": 0,
            "fp_empty_pct": 0.0,
            "n_occupied": 0,
            "miss_rate_count": 0,
            "miss_rate_pct": 0.0,
            "constant_best_c": 0,
            "constant_mae": 0.0,
            "latency_mean_ms": 0.0,
            "latency_p50_ms": 0.0,
            "latency_p95_ms": 0.0,
        }

    diffs = [p - g for g, p in zip(gt_counts, pred_counts)]
    abs_diffs = [abs(d) for d in diffs]

    mae = sum(abs_diffs) / n
    bias = sum(diffs) / n
    exact_pct = (sum(1 for d in abs_diffs if d == 0) / n) * 100.0
    pm1_pct = (sum(1 for d in abs_diffs if d <= 1) / n) * 100.0

    empty_pairs = [(g, p) for g, p in zip(gt_counts, pred_counts) if g == 0]
    n_empty = len(empty_pairs)
    if n_empty > 0:
        fp_empty_count = sum(1 for g, p in empty_pairs if p > 0)
        fp_empty_pct = (fp_empty_count / n_empty) * 100.0
    else:
        fp_empty_count = 0
        fp_empty_pct = 0.0

    occupied_pairs = [(g, p) for g, p in zip(gt_counts, pred_counts) if g > 0]
    n_occupied = len(occupied_pairs)
    if n_occupied > 0:
        miss_rate_count = sum(1 for g, p in occupied_pairs if p == 0)
        miss_rate_pct = (miss_rate_count / n_occupied) * 100.0
    else:
        miss_rate_count = 0
        miss_rate_pct = 0.0

    best_c, const_mae = compute_constant_baseline_mae(gt_counts)

    if latencies_ms and len(latencies_ms) > 0:
        import numpy as np
        lat_arr = np.array(latencies_ms)
        latency_mean = float(np.mean(lat_arr))
        latency_p50 = float(np.percentile(lat_arr, 50))
        latency_p95 = float(np.percentile(lat_arr, 95))
    else:
        latency_mean = 0.0
        latency_p50 = 0.0
        latency_p95 = 0.0

    return {
        "n": n,
        "mae": mae,
        "bias": bias,
        "exact_pct": exact_pct,
        "pm1_pct": pm1_pct,
        "n_empty": n_empty,
        "fp_empty_count": fp_empty_count,
        "fp_empty_pct": fp_empty_pct,
        "n_occupied": n_occupied,
        "miss_rate_count": miss_rate_count,
        "miss_rate_pct": miss_rate_pct,
        "constant_best_c": best_c,
        "constant_mae": const_mae,
        "latency_mean_ms": latency_mean,
        "latency_p50_ms": latency_p50,
        "latency_p95_ms": latency_p95,
    }


def compute_status_metrics(
    gt_counts: Sequence[int],
    pred_counts: Sequence[int],
    capacity: int,
    classify_status_fn: Any,
) -> Dict[str, Any]:
    """Menghitung akurasi status ruangan dan matriks konfusi (Kosong, Rendah, Sedang, Padat)."""
    statuses = ["Kosong", "Rendah", "Sedang", "Padat"]
    gt_statuses = [
        classify_status_fn(g, capacity, status_sedang_min_pct=40.0, status_padat_min_pct=75.0)
        for g in gt_counts
    ]
    pred_statuses = [
        classify_status_fn(p, capacity, status_sedang_min_pct=40.0, status_padat_min_pct=75.0)
        for p in pred_counts
    ]

    n = len(gt_statuses)
    correct = sum(1 for g, p in zip(gt_statuses, pred_statuses) if g == p)
    accuracy_pct = (correct / n * 100.0) if n > 0 else 0.0

    cm: Dict[str, Dict[str, int]] = {g_s: {p_s: 0 for p_s in statuses} for g_s in statuses}
    for g_s, p_s in zip(gt_statuses, pred_statuses):
        if g_s in cm and p_s in cm[g_s]:
            cm[g_s][p_s] += 1

    return {
        "capacity": capacity,
        "accuracy_pct": accuracy_pct,
        "confusion_matrix": cm,
        "gt_statuses": gt_statuses,
        "pred_statuses": pred_statuses,
    }


def compute_fallback_contribution(
    gt_counts: Sequence[int],
    c1_counts: Sequence[int],
    c1_triggered_fallback: Sequence[bool],
) -> Dict[str, Any]:
    """Menghitung statistik kontribusi fallback pada C1 untuk suatu aturan hitungan."""
    n = len(gt_counts)
    if n == 0:
        return {
            "total_frames": 0,
            "triggered_count": 0,
            "triggered_pct": 0.0,
            "found_person_count": 0,
            "true_positive_count": 0,
            "false_positive_count": 0,
        }

    triggered_count = sum(1 for t in c1_triggered_fallback if t)
    triggered_pct = (triggered_count / n) * 100.0

    fallback_found = [
        (g, c)
        for g, c, t in zip(gt_counts, c1_counts, c1_triggered_fallback)
        if t and c >= 1
    ]
    found_person_count = len(fallback_found)
    tp_count = sum(1 for g, c in fallback_found if g > 0)
    fp_count = sum(1 for g, c in fallback_found if g == 0)

    return {
        "total_frames": n,
        "triggered_count": triggered_count,
        "triggered_pct": triggered_pct,
        "found_person_count": found_person_count,
        "true_positive_count": tp_count,
        "false_positive_count": fp_count,
    }


# ==============================================================================
# Format Output Laporan Markdown dan CSV
# ==============================================================================

def generate_summary_markdown(
    meta: Dict[str, Any],
    metrics_by_rule_cfg: Dict[str, Dict[str, Dict[str, Any]]],
    status_metrics_by_cap: Dict[int, Dict[str, Dict[str, Any]]],
    fallback_by_rule: Dict[str, Dict[str, Any]],
    active_configs: Sequence[str],
    active_rules: Sequence[str],
    capacities: Sequence[int],
    status_rule: str,
    skipped_roi_count: int = 0,
    predict_specs: Optional[Dict[str, Dict[str, Any]]] = None,
) -> str:
    """Menghasilkan isi summary.md lengkap: satu tabel per aturan, kontribusi fallback per aturan."""
    md: List[str] = []
    md.append(f"# Laporan Evaluasi Replay Inferensi: {meta.get('name', 'eval')}")
    md.append("")
    md.append(f"- **Waktu Evaluasi**: {meta.get('timestamp', '')}")
    md.append(f"- **Perangkat (Device)**: `{meta.get('device', 'cpu')}`")
    md.append(f"- **Jumlah Gambar Total**: {meta.get('num_images', 0)}")
    md.append(f"- **Aturan Aktif (--rules)**: `{', '.join(active_rules)}`")
    md.append(f"- **Poligon ROI**: `{meta.get('roi_poly_str', '')}`")
    md.append(f"- **Ref Size ROI**: `{meta.get('roi_ref_size_str', 'None')}`")
    md.append(f"- **Batas Tepi (Edge)**: `{meta.get('edge', 3.0)} px`")
    md.append(f"- **Aturan Status Ruangan**: `{status_rule}`")
    md.append("")

    # Bagian Spesifikasi Argumen Predict dan Hash Bobot
    if predict_specs:
        md.append("## Argumen Predict dan Hash Bobot per Konfigurasi")
        md.append("")
        md.append("| Konfigurasi | Deskripsi | Model | SHA256 Bobot | Conf | IoU | Imgsz |")
        md.append("|---|---|---|---|---|---|---|")
        for cfg in active_configs:
            spec = predict_specs.get(cfg, {})
            md.append(
                f"| **{cfg}** | {spec.get('desc', '-')} | `{spec.get('model', '-')}` | "
                f"`{spec.get('sha256', '-')}` | {spec.get('conf', '-')} | "
                f"{spec.get('iou', '-')} | `{spec.get('imgsz', '-')}` |"
            )
        md.append("")
    else:
        md.append("## Bobot Model dan Hash SHA256")
        md.append("")
        md.append("| Model | Path | SHA256 |")
        md.append("|---|---|---|")
        for m_name, m_info in meta.get("models", {}).items():
            md.append(f"| {m_name} | `{m_info.get('path', '-')}` | `{m_info.get('sha256', '-')}` |")
        md.append("")
        md.append("## Parameter Terpasang (.env)")
        md.append("")
        md.append(f"- `MODEL_PATH`: `{meta.get('env_model_path', '-')}`")
        md.append(f"- `CONF_THRESHOLD`: `{meta.get('env_conf', '-')}`")
        md.append(f"- `IOU_THRESHOLD`: `{meta.get('env_iou', '-')}`")
        md.append("")

    # Bagian 1: Metrik per Aturan Hitungan
    md.append("## Metrik Hitungan Orang per Aturan")
    md.append("")
    for rule in active_rules:
        cfg_metrics = metrics_by_rule_cfg.get(rule, {})
        first_m = next(iter(cfg_metrics.values()), {}) if cfg_metrics else {}
        total_n = first_m.get("n", 0)

        md.append(f"### Aturan: `{rule}`")
        md.append("")

        if rule in ("roi", "roi_tepi") and skipped_roi_count > 0:
            md.append(
                f"- **Dilewati**: {skipped_roi_count} gambar (dilewati: ukuran gambar berbeda dari referensi `{meta.get('roi_ref_size_str')}`)"
            )

        if total_n == 0:
            md.append("- *Tidak ada gambar yang dievaluasi untuk aturan ini.*")
            md.append("")
            continue

        const_c = first_m.get("constant_best_c", 0)
        const_mae = first_m.get("constant_mae", 0.0)
        n_empty = first_m.get("n_empty", 0)
        n_empty_pct = (n_empty / total_n * 100.0) if total_n > 0 else 0.0

        md.append(f"- **Gambar Dievaluasi**: {total_n} frame")
        md.append(
            f"- **Baseline Konstan Terkecil**: MAE = `{const_mae:.2f}` (prediksi konstan $c={const_c}$)"
        )
        md.append(
            f"- **Jumlah Frame Kosong ($n_{{kosong}}$)**: `{n_empty}` dari {total_n} frame ({n_empty_pct:.1f}%)"
        )
        md.append("")
        md.append(
            "| Konfigurasi | MAE | Bias | Persis (%) | +-1 (%) | FP Kosong (%) | n_kosong | Miss (%) | Rata-rata ms | P95 ms |"
        )
        md.append("|---|---|---|---|---|---|---|---|---|---|")
        # Baris baseline konstan
        md.append(
            f"| *Konstan (c={const_c})* | *{const_mae:.2f}* | - | - | - | - | {n_empty} | - | - | - |"
        )
        for cfg in active_configs:
            m = cfg_metrics.get(cfg, {})
            md.append(
                f"| **{cfg}** | {m.get('mae', 0.0):.2f} | {m.get('bias', 0.0):.2f} | "
                f"{m.get('exact_pct', 0.0):.1f}% | {m.get('pm1_pct', 0.0):.1f}% | "
                f"{m.get('fp_empty_pct', 0.0):.1f}% | {m.get('n_empty', 0)} | "
                f"{m.get('miss_rate_pct', 0.0):.1f}% | "
                f"{m.get('latency_mean_ms', 0.0):.1f} | {m.get('latency_p95_ms', 0.0):.1f} |"
            )
        md.append("")

        # Kontribusi Fallback C1 untuk aturan ini
        fb = fallback_by_rule.get(rule)
        if fb and "C1" in active_configs:
            md.append(f"#### Kontribusi Fallback pada C1 (`{rule}`)")
            md.append("")
            md.append(f"- **Total Frame**: {fb.get('total_frames', 0)}")
            md.append(
                f"- **Memicu Fallback**: {fb.get('triggered_count', 0)} frame "
                f"({fb.get('triggered_pct', 0.0):.1f}%)"
            )
            md.append(
                f"- **Fallback Menemukan >= 1 Orang**: {fb.get('found_person_count', 0)} frame"
            )
            md.append(
                f"  - **Fallback Benar (GT > 0)**: {fb.get('true_positive_count', 0)} frame"
            )
            md.append(
                f"  - **Fallback False Alarm (GT == 0)**: {fb.get('false_positive_count', 0)} frame"
            )
            md.append("")

    # Bagian 2: Akurasi Status Ruangan berdasarkan aturan terpilih (--status-rule)
    if status_rule in active_rules and status_metrics_by_cap:
        md.append(f"## Akurasi Status Ruangan per Kapasitas (Aturan: `{status_rule}`)")
        md.append("")
        for cap in capacities:
            md.append(f"### Kapasitas {cap}")
            md.append("")
            md.append("| Konfigurasi | Akurasi Status (%) |")
            md.append("|---|---|")
            for cfg in active_configs:
                acc = status_metrics_by_cap.get(cap, {}).get(cfg, {}).get("accuracy_pct", 0.0)
                md.append(f"| {cfg} | {acc:.1f}% |")
            md.append("")

            # Matriks konfusi
            for cfg in active_configs:
                cm = status_metrics_by_cap.get(cap, {}).get(cfg, {}).get("confusion_matrix", {})
                if cm:
                    md.append(f"#### Matriks Konfusi {cfg} (Kapasitas {cap}, Aturan `{status_rule}`)")
                    md.append("")
                    md.append("| GT \\ Pred | Kosong | Rendah | Sedang | Padat |")
                    md.append("|---|---|---|---|---|")
                    for row_s in ["Kosong", "Rendah", "Sedang", "Padat"]:
                        r = cm.get(row_s, {})
                        md.append(
                            f"| **{row_s}** | {r.get('Kosong', 0)} | {r.get('Rendah', 0)} | "
                            f"{r.get('Sedang', 0)} | {r.get('Padat', 0)} |"
                        )
                    md.append("")

    # Bagian 3: Selisih terhadap C1 pada aturan status_rule
    if "C1" in active_configs and len(active_configs) > 1 and status_rule in active_rules:
        c1_m = metrics_by_rule_cfg.get(status_rule, {}).get("C1", {})
        if c1_m.get("n", 0) > 0:
            md.append(f"## Perbandingan Selisih terhadap C1 (Aturan: `{status_rule}`)")
            md.append("")
            md.append("*(Delta MAE negatif berarti lebih baik; Delta Akurasi positif berarti lebih baik)*")
            md.append("")
            first_cap = capacities[0] if capacities else 10
            md.append(
                f"| Konfigurasi | Delta MAE | Delta Akurasi Persis (%) | Delta Akurasi Status (Cap {first_cap}) (%) |"
            )
            md.append("|---|---|---|---|")
            c1_mae = c1_m.get("mae", 0.0)
            c1_exact = c1_m.get("exact_pct", 0.0)
            c1_st_acc = (
                status_metrics_by_cap.get(first_cap, {}).get("C1", {}).get("accuracy_pct", 0.0)
            )

            for cfg in active_configs:
                if cfg == "C1":
                    continue
                cur_m = metrics_by_rule_cfg.get(status_rule, {}).get(cfg, {})
                cur_mae = cur_m.get("mae", 0.0)
                cur_exact = cur_m.get("exact_pct", 0.0)
                cur_st_acc = (
                    status_metrics_by_cap.get(first_cap, {}).get(cfg, {}).get("accuracy_pct", 0.0)
                )

                d_mae = cur_mae - c1_mae
                d_exact = cur_exact - c1_exact
                d_st = cur_st_acc - c1_st_acc
                md.append(f"| {cfg} | {d_mae:+.2f} | {d_exact:+.1f}% | {d_st:+.1f}% |")
            md.append("")

    # Catatan interpretasi otomatis
    md.append("## Catatan Interpretasi")
    md.append("")
    for rule in active_rules:
        cfg_m = metrics_by_rule_cfg.get(rule, {})
        first_m = next(iter(cfg_m.values()), {}) if cfg_m else {}
        if first_m.get("n", 0) == 0:
            continue
        best_mae_cfg = min(active_configs, key=lambda c: cfg_m.get(c, {}).get("mae", float("inf")))
        best_exact_cfg = max(active_configs, key=lambda c: cfg_m.get(c, {}).get("exact_pct", -1.0))
        md.append(
            f"- **`{rule}`**: MAE Terendah = `{best_mae_cfg}` ({cfg_m[best_mae_cfg]['mae']:.2f}) | "
            f"Akurasi Persis Tertinggi = `{best_exact_cfg}` ({cfg_m[best_exact_cfg]['exact_pct']:.1f}%)"
        )
    if status_rule in active_rules and status_metrics_by_cap:
        first_cap = capacities[0] if capacities else 10
        best_status_cfg = max(
            active_configs,
            key=lambda c: status_metrics_by_cap.get(first_cap, {}).get(c, {}).get("accuracy_pct", -1.0),
        )
        md.append(
            f"- **Akurasi Status Tertinggi (Cap {first_cap}, Aturan `{status_rule}`)**: `{best_status_cfg}` "
            f"({status_metrics_by_cap[first_cap][best_status_cfg]['accuracy_pct']:.1f}%)"
        )
    md.append("")
    return "\n".join(md)


# ==============================================================================
# CLI Argument Parser
# ==============================================================================

def create_parser() -> argparse.ArgumentParser:
    """Membangun parser argumen CLI untuk eval_replay."""
    parser = argparse.ArgumentParser(
        description="Replay evaluasi offline membandingkan pipeline inferensi terpasang vs konfigurasi eksperimen."
    )
    parser.add_argument("--images", required=True, type=str, help="Direktori berisi gambar pengujian")
    parser.add_argument("--labels", required=True, type=str, help="Direktori berisi label YOLO TXT")
    parser.add_argument("--name", required=True, type=str, help="Nama subdirektori keluaran evaluasi")
    parser.add_argument("--s1", required=True, type=str, help="Path ke bobot run saat ini (s1)")
    parser.add_argument("--s0", default="yolov8n.pt", type=str, help="Path ke bobot s0 (default: yolov8n.pt)")
    parser.add_argument(
        "--best", default="app/models/best.pt", type=str, help="Path ke bobot best (default: app/models/best.pt)"
    )
    parser.add_argument(
        "--eval-conf", default=0.25, type=float, help="Confidence threshold evaluasi bersih (default: 0.25)"
    )
    parser.add_argument(
        "--eval-imgsz", default=960, type=int, help="Image size evaluasi bersih (default: 960)"
    )
    parser.add_argument(
        "--eval-iou", default=0.7, type=float, help="IoU threshold parameter evaluasi (default: 0.7, izinkan 0.45)"
    )
    parser.add_argument(
        "--capacity",
        default=[10],
        nargs="+",
        type=int,
        help="Daftar kapasitas ruangan untuk matriks status (default: 10)",
    )
    parser.add_argument(
        "--rules",
        default=["roi", "roi_tepi", "frame_penuh"],
        nargs="+",
        choices=["frame_penuh", "roi", "roi_tepi"],
        help="Daftar aturan hitungan yang diaktifkan (default: roi roi_tepi frame_penuh)",
    )
    parser.add_argument(
        "--roi-poly",
        default=DEFAULT_ROI_POLY,
        type=str,
        help=f"Koordinat piksel poligon ROI 'x,y;x,y;...' (default: {DEFAULT_ROI_POLY})",
    )
    parser.add_argument(
        "--roi-ref-size",
        default=DEFAULT_ROI_REF_SIZE,
        type=str,
        help=f"Ukuran gambar acuan poligon ROI 'WxH' (default: {DEFAULT_ROI_REF_SIZE}). Poligon HANYA diterapkan pada gambar yang berukuran ini.",
    )
    parser.add_argument(
        "--edge",
        default=DEFAULT_EDGE,
        type=float,
        help="Batas tepi piksel untuk aturan roi_tepi (default: 3)",
    )
    parser.add_argument(
        "--status-rule",
        default="frame_penuh",
        choices=["frame_penuh", "roi", "roi_tepi"],
        help="Aturan hitungan yang digunakan untuk akurasi status ruangan dan matriks konfusi (default: frame_penuh)",
    )
    parser.add_argument("--limit", default=None, type=int, help="Batasi pemrosesan pada N gambar pertama")
    parser.add_argument(
        "--device",
        default="auto",
        type=str,
        help="Device inferensi ('auto', 'cpu', 'cuda', dsb.)",
    )
    parser.add_argument("--out", default="eval_out", type=str, help="Direktori keluaran (default: eval_out/)")
    parser.add_argument(
        "--assume-empty",
        action="store_true",
        help="Jika label TXT tidak ada untuk gambar, anggap count=0",
    )
    parser.add_argument(
        "--no-primary",
        action="store_true",
        help="Simulasi kondisi model primary gagal dimuat, C1 hanya memakai fallback",
    )
    parser.add_argument(
        "--configs",
        default=["C1", "C2", "C3", "C4", "C5"],
        nargs="+",
        choices=["C1", "C2", "C3", "C4", "C5"],
        help="Daftar konfigurasi yang diuji (default: C1 C2 C3 C4 C5)",
    )
    parser.add_argument(
        "--person-classes",
        default=[0],
        nargs="+",
        type=int,
        help="Daftar ID kelas orang pada label YOLO (default: 0)",
    )
    return parser


# ==============================================================================
# Main Orchestrator (Offline Execution)
# ==============================================================================

def main(args_list: Optional[Sequence[str]] = None) -> int:
    parser = create_parser()
    args = parser.parse_args(args_list)

    # Resolusi direktori dasar service_ai/
    service_ai_dir = Path(__file__).resolve().parent.parent

    # Impor dslb_core
    dslb_core = load_dslb_core(service_ai_dir)
    classify_status_fn = dslb_core.classify_status

    # Baca konfigurasi terpasang dari service_ai/.env
    env_cfg = read_env_config(service_ai_dir)
    env_conf = env_cfg["conf"]
    env_iou = env_cfg["iou"]

    # Parse poligon ROI dan ref size (tanpa penskalaan proporsional)
    base_roi_pts = parse_roi_poly(args.roi_poly)
    ref_size = parse_roi_ref_size(args.roi_ref_size)
    edge = float(args.edge)
    active_rules: List[str] = list(args.rules)

    # Tentukan aturan status ruangan
    status_rule = args.status_rule
    if status_rule not in active_rules:
        status_rule = active_rules[0]

    # Model yang diperlukan berdasarkan active configs
    needed_models = set()
    for c in args.configs:
        if c in ("C1", "C2", "C5"):
            needed_models.add("s0")
        if c == "C1":
            needed_models.add("best")
        if c in ("C3", "C4"):
            needed_models.add("s1")

    # Resolusi path bobot model
    s1_path = resolve_service_ai_path(args.s1, service_ai_dir)
    if "s1" in needed_models:
        if not s1_path.is_file():
            raise FileNotFoundError(f"Bobot s1 tidak ditemukan: {s1_path}")

    s0_path = resolve_service_ai_path(args.s0, service_ai_dir)
    if "s0" in needed_models:
        if not s0_path.is_file():
            raise FileNotFoundError(f"Bobot s0 tidak ditemukan: {s0_path}")

    best_path = resolve_service_ai_path(args.best, service_ai_dir)
    if "best" in needed_models:
        if not best_path.is_file():
            raise FileNotFoundError(f"Bobot best tidak ditemukan: {best_path}")

    # Set pencegahan autoinstall ultralytics
    os.environ["YOLO_AUTOINSTALL"] = "False"
    from ultralytics import YOLO
    import cv2
    import numpy as np

    polygon = np.array(base_roi_pts, dtype=np.float32)
    device = resolve_device(args.device)

    # Kumpulkan metadata bobot model
    model_meta: Dict[str, Dict[str, str]] = {}
    if s0_path.is_file():
        model_meta["s0"] = {"path": str(s0_path), "sha256": calculate_sha256(s0_path)}
    if s1_path.is_file():
        model_meta["s1"] = {"path": str(s1_path), "sha256": calculate_sha256(s1_path)}
    if best_path.is_file():
        model_meta["best"] = {"path": str(best_path), "sha256": calculate_sha256(best_path)}

    # Muat model yang diperlukan
    loaded_models: Dict[str, Any] = {}
    if "s0" in needed_models:
        loaded_models["s0"] = YOLO(str(s0_path))
    if "best" in needed_models:
        loaded_models["best"] = YOLO(str(best_path))
    if "s1" in needed_models:
        loaded_models["s1"] = YOLO(str(s1_path))

    # Kumpulkan daftar gambar
    images_dir = Path(args.images)
    if not images_dir.is_dir():
        raise NotADirectoryError(f"Direktori gambar tidak ditemukan: {images_dir}")

    labels_dir = Path(args.labels)
    if not labels_dir.is_dir():
        raise NotADirectoryError(f"Direktori label tidak ditemukan: {labels_dir}")

    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    image_files = sorted([f for f in images_dir.iterdir() if f.suffix.lower() in valid_exts])
    if args.limit is not None and args.limit > 0:
        image_files = image_files[: args.limit]

    if not image_files:
        print(f"Peringatan: Tidak ada gambar ditemukan di {images_dir}")
        return 0

    # Struktur penampung hasil per aturan aktif
    per_frame_records: List[Dict[str, Any]] = []
    latencies: Dict[str, List[float]] = {cfg: [] for cfg in args.configs}

    gt_counts_by_rule: Dict[str, List[int]] = {r: [] for r in active_rules}
    pred_counts_by_rule: Dict[str, Dict[str, List[int]]] = {
        r: {cfg: [] for cfg in args.configs} for r in active_rules
    }
    c1_triggered_by_rule: Dict[str, List[bool]] = {r: [] for r in active_rules}

    skipped_roi_count = 0

    # Iterasi gambar pengujian
    for img_p in image_files:
        frame = cv2.imread(str(img_p))
        if frame is None:
            continue
        h, w = frame.shape[:2]

        matches_ref = (ref_size is not None and (w, h) == ref_size)
        if not matches_ref and any(r in active_rules for r in ["roi", "roi_tepi"]):
            skipped_roi_count += 1

        # 1. Kotak Ground Truth
        label_p = labels_dir / f"{img_p.stem}.txt"
        gt_boxes = parse_yolo_label_boxes(
            label_p,
            width=w,
            height=h,
            person_classes=args.person_classes,
            assume_empty=args.assume_empty,
        )
        gt_counts = evaluate_image_rules(
            boxes=gt_boxes,
            img_width=w,
            img_height=h,
            polygon=polygon,
            ref_size=ref_size,
            active_rules=active_rules,
            edge=edge,
        )

        for r in active_rules:
            if gt_counts[r] is not None:
                gt_counts_by_rule[r].append(gt_counts[r])

        rec: Dict[str, Any] = {"filename": img_p.name}
        for r in active_rules:
            rec[f"gt_{r}"] = gt_counts[r] if gt_counts[r] is not None else ""

        # 2. Eksekusi Prediksi untuk setiap Konfigurasi aktif (C1 - C5)
        for cfg in args.configs:
            t0 = time.perf_counter()
            cfg_res, cfg_trig = run_config_predict(
                cfg=cfg,
                frame=frame,
                loaded_models=loaded_models,
                env_conf=env_conf,
                env_iou=env_iou,
                eval_conf=args.eval_conf,
                eval_imgsz=args.eval_imgsz,
                eval_iou=args.eval_iou,
                person_classes=args.person_classes,
                device=device,
                no_primary=args.no_primary,
            )
            cfg_ms = (time.perf_counter() - t0) * 1000.0
            cfg_boxes = extract_pred_boxes(cfg_res[0].boxes if cfg_res else None)
            cfg_counts = evaluate_image_rules(
                boxes=cfg_boxes,
                img_width=w,
                img_height=h,
                polygon=polygon,
                ref_size=ref_size,
                active_rules=active_rules,
                edge=edge,
            )

            c_low = cfg.lower()
            for r in active_rules:
                rec[f"{c_low}_{r}"] = cfg_counts[r] if cfg_counts[r] is not None else ""
                if cfg_counts[r] is not None:
                    pred_counts_by_rule[r][cfg].append(cfg_counts[r])
                    if cfg == "C1":
                        c1_triggered_by_rule[r].append(cfg_trig)

            if cfg == "C1":
                rec["c1_triggered_fallback"] = cfg_trig
            rec[f"{c_low}_ms"] = round(cfg_ms, 2)
            latencies[cfg].append(cfg_ms)

        per_frame_records.append(rec)

    # Direktori keluaran: --out/NAMA/
    out_dir = Path(args.out) / args.name
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Tulis per_frame.csv (hanya untuk aturan aktif)
    per_frame_csv = out_dir / "per_frame.csv"
    csv_fields = ["filename"] + [f"gt_{r}" for r in active_rules]
    for cfg in args.configs:
        c_low = cfg.lower()
        csv_fields.extend([f"{c_low}_{r}" for r in active_rules])
        if cfg == "C1":
            csv_fields.append("c1_triggered_fallback")
        csv_fields.append(f"{c_low}_ms")

    with open(per_frame_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields)
        writer.writeheader()
        for r in per_frame_records:
            writer.writerow({k: r.get(k, "") for k in csv_fields})

    # Hitung metrik agregat per aturan
    metrics_by_rule_cfg: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for r in active_rules:
        cfg_m: Dict[str, Dict[str, Any]] = {}
        for cfg in args.configs:
            cfg_m[cfg] = compute_metrics(
                gt_counts=gt_counts_by_rule[r],
                pred_counts=pred_counts_by_rule[r][cfg],
                latencies_ms=latencies[cfg],
            )
        metrics_by_rule_cfg[r] = cfg_m

    # Kontribusi Fallback C1 per aturan
    fallback_by_rule: Dict[str, Dict[str, Any]] = {}
    if "C1" in args.configs:
        for r in active_rules:
            fallback_by_rule[r] = compute_fallback_contribution(
                gt_counts=gt_counts_by_rule[r],
                c1_counts=pred_counts_by_rule[r]["C1"],
                c1_triggered_fallback=c1_triggered_by_rule[r],
            )

    # 2. Hitung status dan matriks konfusi berdasarkan status_rule
    status_metrics_by_cap: Dict[int, Dict[str, Dict[str, Any]]] = {}
    st_gt_counts = gt_counts_by_rule.get(status_rule, [])

    if len(st_gt_counts) > 0:
        for cap in args.capacity:
            cap_dict: Dict[str, Dict[str, Any]] = {}
            status_csv = out_dir / f"status_{cap}.csv"
            st_fields = ["filename", "gt_count", "gt_status"]
            for cfg in args.configs:
                c_low = cfg.lower()
                st_fields.extend([f"{c_low}_count", f"{c_low}_status"])

            status_rows: List[Dict[str, Any]] = []
            gt_statuses = [
                classify_status_fn(g, cap, status_sedang_min_pct=40.0, status_padat_min_pct=75.0)
                for g in st_gt_counts
            ]

            cfg_statuses: Dict[str, List[str]] = {}
            for cfg in args.configs:
                st_res = compute_status_metrics(
                    gt_counts=st_gt_counts,
                    pred_counts=pred_counts_by_rule[status_rule][cfg],
                    capacity=cap,
                    classify_status_fn=classify_status_fn,
                )
                cap_dict[cfg] = st_res
                cfg_statuses[cfg] = st_res["pred_statuses"]

            # Filter record yang memiliki nilai di status_rule
            filtered_records = [
                r for r in per_frame_records if r.get(f"gt_{status_rule}") != ""
            ]
            for idx, r in enumerate(filtered_records):
                s_row: Dict[str, Any] = {
                    "filename": r["filename"],
                    "gt_count": st_gt_counts[idx],
                    "gt_status": gt_statuses[idx],
                }
                for cfg in args.configs:
                    c_low = cfg.lower()
                    s_row[f"{c_low}_count"] = pred_counts_by_rule[status_rule][cfg][idx]
                    s_row[f"{c_low}_status"] = cfg_statuses[cfg][idx]
                status_rows.append(s_row)

            with open(status_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=st_fields)
                writer.writeheader()
                writer.writerows(status_rows)

            status_metrics_by_cap[cap] = cap_dict

    # 3. Tulis summary.md
    meta_info: Dict[str, Any] = {
        "name": args.name,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "device": device,
        "num_images": len(image_files),
        "roi_poly_str": args.roi_poly,
        "roi_ref_size_str": args.roi_ref_size if args.roi_ref_size else "None",
        "edge": edge,
        "models": model_meta,
        "env_model_path": env_cfg["model_path"],
        "env_conf": env_conf,
        "env_iou": env_iou,
    }

    # Spesifikasi argumen predict per konfigurasi untuk dicetak ke summary.md
    s0_hash = model_meta.get("s0", {}).get("sha256", "-")
    s1_hash = model_meta.get("s1", {}).get("sha256", "-")
    best_hash = model_meta.get("best", {}).get("sha256", "-")

    predict_specs = {
        "C1": {
            "desc": "Pipeline terpasang (s0 primary + best fallback)",
            "model": "s0 + best",
            "sha256": f"s0: {s0_hash}<br>best: {best_hash}",
            "conf": f"{env_conf:.2f}",
            "iou": f"{env_iou:.2f}",
            "imgsz": "default",
        },
        "C2": {
            "desc": "S0 parameter terpasang (tanpa fallback)",
            "model": "s0",
            "sha256": s0_hash,
            "conf": f"{env_conf:.2f}",
            "iou": f"{env_iou:.2f}",
            "imgsz": "default",
        },
        "C3": {
            "desc": "S1 parameter terpasang (tanpa fallback)",
            "model": "s1",
            "sha256": s1_hash,
            "conf": f"{env_conf:.2f}",
            "iou": f"{env_iou:.2f}",
            "imgsz": "default",
        },
        "C4": {
            "desc": "S1 parameter evaluasi",
            "model": "s1",
            "sha256": s1_hash,
            "conf": f"{args.eval_conf:.2f}",
            "iou": f"{args.eval_iou:.2f}" if args.eval_iou is not None else "default",
            "imgsz": str(args.eval_imgsz),
        },
        "C5": {
            "desc": "S0 parameter evaluasi",
            "model": "s0",
            "sha256": s0_hash,
            "conf": f"{args.eval_conf:.2f}",
            "iou": f"{args.eval_iou:.2f}" if args.eval_iou is not None else "default",
            "imgsz": str(args.eval_imgsz),
        },
    }

    summary_content = generate_summary_markdown(
        meta=meta_info,
        metrics_by_rule_cfg=metrics_by_rule_cfg,
        status_metrics_by_cap=status_metrics_by_cap,
        fallback_by_rule=fallback_by_rule,
        active_configs=args.configs,
        active_rules=active_rules,
        capacities=args.capacity,
        status_rule=status_rule,
        skipped_roi_count=skipped_roi_count,
        predict_specs=predict_specs,
    )
    summary_md_path = out_dir / "summary.md"
    with open(summary_md_path, "w", encoding="utf-8") as f:
        f.write(summary_content)

    # 4. Tampilkan tabel ringkasan ke konsol
    print(f"\n=== HASIL EVALUASI REPLAY: {args.name} ===")
    print(
        f"Gambar dievaluasi: {len(image_files)} | Perangkat: {device} | Aturan Aktif: {', '.join(active_rules)}"
    )
    header_fmt = "{:<6} | {:<6} | {:<6} | {:<10} | {:<8} | {:<11} | {:<8} | {:<9} | {:<8}"
    row_fmt = "{:<6} | {:<6.2f} | {:<6.2f} | {:<10.1f} | {:<8.1f} | {:<11.1f} | {:<8} | {:<9.1f} | {:<8.1f}"

    for r in active_rules:
        print(f"\n--- Aturan: {r} ---")
        if r in ("roi", "roi_tepi") and skipped_roi_count > 0:
            print(f"(dilewati: {skipped_roi_count} gambar karena ukuran gambar berbeda dari referensi)")
        cfg_m = metrics_by_rule_cfg[r]
        first_m = next(iter(cfg_m.values()), {}) if cfg_m else {}
        if first_m.get("n", 0) == 0:
            print("Tidak ada frame yang dievaluasi.")
            continue
        print(
            f"Baseline Konstan: MAE={first_m['constant_mae']:.2f} (c={first_m['constant_best_c']}) | n_kosong={first_m['n_empty']}"
        )
        print(
            header_fmt.format("Config", "MAE", "Bias", "Persis (%)", "+-1 (%)", "FP Kosong %", "n_kosong", "Miss (%)", "Lat (ms)")
        )
        print("-" * 88)
        for cfg in args.configs:
            m = cfg_m[cfg]
            print(
                row_fmt.format(
                    cfg,
                    m["mae"],
                    m["bias"],
                    m["exact_pct"],
                    m["pm1_pct"],
                    m["fp_empty_pct"],
                    m["n_empty"],
                    m["miss_rate_pct"],
                    m["latency_mean_ms"],
                )
            )

    print(f"\nBerkas keluaran tersimpan di: {out_dir.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
