import os
from markitdown import MarkItDown

def merge_all_to_single_markdown():
    md = MarkItDown()
    
    # Daftar file sesuai urutan di gambar
    files_to_convert = [
        "boot_recovery.py",
        "camera_loader.py",
        "db_healthcheck.py",
        "db_state.py",
        "decision_engine.py",
        "inference_realtime.py",
        "log_writer.py",
        "mqtt_commands.py",
        "mqtt_subscriber.py",
        "results.py",
        "schedule_runner.py",
        "snapshot.py",
        "statistics_engine.py",
        "test_camera.py",
        "test_picture.py",
        "train.py",
        "zona_loader.py"
    ]
    
    output_filename = "all_code_documentation.md"
    
    print(f"================== Memulai Penggabungan ==================")
    
    with open(output_filename, "w", encoding="utf-8") as main_file:
        # Menulis Judul Utama Dokumen
        main_file.write("# Dokumentasi Kode Proyek\n\n")
        main_file.write(f"Dibuat otomatis menggunakan MarkItDown.\n\n---\n\n")
        
        for file_name in files_to_convert:
            if not os.path.exists(file_name):
                print(f"[Peringatan] File {file_name} tidak ditemukan. Dilewati.")
                continue
                
            try:
                # Mengonversi file menggunakan MarkItDown
                result = md.convert(file_name)
                
                # Menulis header untuk tiap file di dalam file utama
                main_file.write(f"## File: `{file_name}`\n\n")
                main_file.write("```python\n")
                main_file.write(result.text_content.strip())
                main_file.write("\n```\n\n")
                main_file.write("---\n\n") # Pembatas antar file
                
                print(f"[Sukses] Memasukkan {file_name} ke dalam dokumentasi.")
            except Exception as e:
                print(f"[Gagal] Gagal memproses {file_name}. Error: {e}")

    print(f"================== Selesai! Hasil: {output_filename} ==================")

if __name__ == "__main__":
    merge_all_to_single_markdown()