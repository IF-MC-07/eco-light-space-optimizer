import os
import time

def verify_no_files_saved(duration_minutes=5):
    target_exts = {".jpg", ".jpeg", ".png", ".avi", ".mp4", ".mkv", ".pt"} # .pt just in case YOLO downloads weights, but we care about images
    print(f"🕵️‍♂️ Memulai pemantauan direktori selama {duration_minutes} menit...")
    start_time = time.time()
    initial_files = set(os.listdir('.'))
    
    while time.time() - start_time < duration_minutes * 60:
        current_files = set(os.listdir('.'))
        new_files = current_files - initial_files
        
        media_files = [f for f in new_files if os.path.splitext(f)[1].lower() in target_exts]
        
        if media_files:
            print(f"❌ PELANGGARAN PRIVASI! File media baru terdeteksi: {media_files}")
            return False
            
        time.sleep(10) # Cek setiap 10 detik
        
    print("✅ VERIFIKASI BERHASIL: Tidak ada frame atau file media yang disimpan ke disk selama sistem berjalan.")
    return True

if __name__ == "__main__":
    verify_no_files_saved(5)
