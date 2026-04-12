from ultralytics import YOLO
import cv2

model = YOLO('yolov8n.pt')

results = model.predict(
    r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\images.jpg',
    conf=0.25,
    iou=0.45,
    classes=[0],
    imgsz=1280,
    show_labels=False,  # ← hilangkan label
    show_conf=False,    # ← hilangkan confidence score
    save=True,
    show=True
)

print(f"Terdeteksi: {len(results[0].boxes)} orang")