import cv2
from ultralytics import YOLO

# Pakai model bawaan YOLOv8 - SUDAH BISA DETEKSI ORANG!
model = YOLO('yolov8n.pt')

cap = cv2.VideoCapture(0)
print("✅ Kamera aktif! Tekan 'q' untuk keluar")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # classes=[0] artinya hanya deteksi 'person'
    results = model.predict(frame, conf=0.5, classes=[0], verbose=False)

    annotated = results[0].plot()

    count = len(results[0].boxes)
    cv2.putText(annotated, f'Jumlah Orang: {count}', (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow('Deteksi Orang - Tekan Q keluar', annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()