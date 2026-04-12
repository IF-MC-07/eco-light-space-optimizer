from ultralytics import YOLO

model = YOLO('yolov8n.pt')

# Evaluasi di dataset kamu
results = model.val(
    data=r'PATH_KE\data.yaml',
    split='test'
)

print(f"mAP50: {results.box.map50:.4f}")