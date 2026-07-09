from pathlib import Path

from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = Path(__file__).resolve().parent
PRETRAINED_MODEL_PATH = BASE_DIR / 'yolov8n.pt'
CUSTOM_MODEL_PATH = BASE_DIR / 'app' / 'models' / 'best.pt'
DATASET_PATH = MODEL_DIR / 'datasets' / 'data.yaml'
SOURCE_PATH = MODEL_DIR / 'datasets' / 'valid' / 'images'
COMPARISON_DIR = BASE_DIR / 'runs' / 'comparison'


def evaluate_model(model_path: Path, model_name: str):
    print(f"\n--- Mengevaluasi {model_name} ---")
    model = YOLO(str(model_path))
    metrics = model.val(
        data=str(DATASET_PATH),
        split='val',
        plots=True,
        project=str(COMPARISON_DIR),
        name=model_name,
        save=True,
        classes=[0],
    )

    print(f"{model_name} mAP50: {metrics.box.map50}")
    print(f"{model_name} mAP50-95: {metrics.box.map}")
    print(f"Grafik disimpan di: {metrics.save_dir}")
    return model


# 1. UJI MODEL PRETRAINED (YOLOv8n)
model_pretrained = evaluate_model(PRETRAINED_MODEL_PATH, 'pretrained_results')

# 2. UJI MODEL HASIL TRAINING ANDA (best.pt)
model_custom = evaluate_model(CUSTOM_MODEL_PATH, 'custom_results')

# Inferensi dengan model pretrained
model_pretrained.predict(
    source=str(SOURCE_PATH),
    save=True,
    project=str(COMPARISON_DIR),
    name='pretrained_predictions',
    classes=[0],
)

# Inferensi dengan model kustom
model_custom.predict(
    source=str(SOURCE_PATH),
    save=True,
    project=str(COMPARISON_DIR),
    name='custom_predictions',
    classes=[0],
)