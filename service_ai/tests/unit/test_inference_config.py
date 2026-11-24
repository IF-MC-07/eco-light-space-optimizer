import os
import sys
import logging
from unittest.mock import MagicMock
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app import inference_realtime


@pytest.fixture(autouse=True)
def reset_inference_state(monkeypatch):
    """Reset shared inference model state and warning cache before and after each test."""
    inference_realtime._model_primary = None
    inference_realtime._model_fallback = None
    inference_realtime._models_loaded = False
    inference_realtime._imgsz_warned.clear()
    yield
    inference_realtime._model_primary = None
    inference_realtime._model_fallback = None
    inference_realtime._models_loaded = False
    inference_realtime._imgsz_warned.clear()


class FakeYOLO:
    created_instances = []

    def __init__(self, model_path):
        self.model_path = model_path
        FakeYOLO.created_instances.append(self)
        self.predict_calls = []

    def predict(self, *args, **kwargs):
        self.predict_calls.append({"args": args, "kwargs": kwargs})
        box_mock = MagicMock()
        box_mock.boxes = []
        return [box_mock]


@pytest.fixture(autouse=True)
def mock_yolo(monkeypatch):
    FakeYOLO.created_instances.clear()
    monkeypatch.setattr(inference_realtime, "YOLO", FakeYOLO)


def test_fallback_disabled_when_unset(monkeypatch, caplog):
    """Jika FALLBACK_MODEL_PATH tidak diatur, fallback nonaktif (None) dan info dicatat."""
    monkeypatch.delenv("FALLBACK_MODEL_PATH", raising=False)

    with caplog.at_level(logging.INFO):
        primary, fallback = inference_realtime.get_model()

    assert primary is not None
    assert fallback is None
    assert any("fallback dinonaktifkan" in rec.message.lower() for rec in caplog.records)


def test_fallback_disabled_when_empty_string(monkeypatch, caplog):
    """Jika FALLBACK_MODEL_PATH diatur ke string kosong, fallback tidak dimuat dan log info dicatat."""
    monkeypatch.setenv("FALLBACK_MODEL_PATH", "")

    with caplog.at_level(logging.INFO):
        primary, fallback = inference_realtime.get_model()

    assert primary is not None
    assert fallback is None
    # Pastikan pesan info tercatat dan tidak ada error
    assert any("fallback dinonaktifkan" in rec.message.lower() for rec in caplog.records)
    assert not any(rec.levelno >= logging.ERROR and "fallback" in rec.message.lower() for rec in caplog.records)


def test_fallback_active_when_nonempty_path(monkeypatch):
    """Fallback aktif hanya bila FALLBACK_MODEL_PATH berisi path non-kosong."""
    monkeypatch.setenv("FALLBACK_MODEL_PATH", "custom/models/fallback.pt")

    primary, fallback = inference_realtime.get_model()

    assert primary is not None
    assert fallback is not None
    assert fallback.model_path == "custom/models/fallback.pt"


def test_model_load_info_log(monkeypatch, caplog):
    """Log INFO saat model dimuat mencakup primary, fallback atau dinonaktifkan, conf, iou, dan imgsz."""
    monkeypatch.setenv("FALLBACK_MODEL_PATH", "")
    monkeypatch.setenv("INFERENCE_IMGSZ", "640")

    with caplog.at_level(logging.INFO):
        inference_realtime.get_model()

    model_logs = [rec.message for rec in caplog.records if "Model loaded:" in rec.message or "primary=" in rec.message]
    assert len(model_logs) > 0
    log_text = model_logs[0]
    assert "primary=" in log_text
    assert "fallback=dinonaktifkan" in log_text
    assert "conf=" in log_text
    assert "iou=" in log_text
    assert "imgsz=640" in log_text


def test_imgsz_not_sent_when_unset(monkeypatch):
    """Jika INFERENCE_IMGSZ tidak diatur, kwargs predict tidak memuat imgsz."""
    monkeypatch.delenv("INFERENCE_IMGSZ", raising=False)

    kwargs = inference_realtime.get_predict_kwargs()
    assert "imgsz" not in kwargs
    assert kwargs["conf"] == inference_realtime.CONF_THRESHOLD
    assert kwargs["iou"] == inference_realtime.IOU_THRESHOLD


def test_imgsz_sent_when_configured(monkeypatch):
    """Jika INFERENCE_IMGSZ diatur bilangan bulat positif, kwargs predict memuat imgsz."""
    monkeypatch.setenv("INFERENCE_IMGSZ", "640")

    kwargs = inference_realtime.get_predict_kwargs()
    assert "imgsz" in kwargs
    assert kwargs["imgsz"] == 640


@pytest.mark.parametrize("invalid_val", ["0", "-640", "abc", "   "])
def test_imgsz_ignored_when_invalid(monkeypatch, invalid_val):
    """Jika INFERENCE_IMGSZ bernilai tidak valid atau <= 0, imgsz tidak dikirim."""
    monkeypatch.setenv("INFERENCE_IMGSZ", invalid_val)

    kwargs = inference_realtime.get_predict_kwargs()
    assert "imgsz" not in kwargs


def test_parse_imgsz_warning_logged_once(caplog):
    """Nilai tidak valid mencatat log WARNING satu kali per nilai dan menghasilkan None."""
    with caplog.at_level(logging.WARNING):
        res1 = inference_realtime._parse_imgsz("invalid_abc")
        res2 = inference_realtime._parse_imgsz("invalid_abc")

    assert res1 is None
    assert res2 is None
    warning_records = [
        rec for rec in caplog.records
        if rec.levelno == logging.WARNING and "INFERENCE_IMGSZ tidak valid" in rec.message and "invalid_abc" in rec.message
    ]
    assert len(warning_records) == 1


def test_predict_receives_configured_imgsz_on_both_models(monkeypatch):
    """Memverifikasi bahwa argumen kwargs (termasuk imgsz) dikirim ke pemanggilan predict model utama dan fallback."""
    monkeypatch.setenv("INFERENCE_IMGSZ", "320")
    monkeypatch.setenv("FALLBACK_MODEL_PATH", "app/models/best.pt")

    primary, fallback = inference_realtime.get_model()
    dummy_frame = MagicMock()
    predict_kwargs = inference_realtime.get_predict_kwargs()

    # Panggil predict seperti di camera_worker
    res_primary = primary.predict(dummy_frame, **predict_kwargs)
    assert len(res_primary[0].boxes) == 0

    res_fallback = fallback.predict(dummy_frame, **predict_kwargs)

    assert primary.predict_calls[0]["kwargs"]["imgsz"] == 320
    assert fallback.predict_calls[0]["kwargs"]["imgsz"] == 320
