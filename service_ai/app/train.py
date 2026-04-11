from ultralytics import YOLO

model = YOLO('yolov8n.pt')

results = model.train(
    data=r'C:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\service_ai\data\data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    name='deteksi-kelas',
    patience=10,
    device='cpu'
)

print("Training selesai!")
print(f"Model terbaik: {results.save_dir}/weights/best.pt")