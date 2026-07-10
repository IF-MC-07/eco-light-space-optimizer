import os

# Daftar file yang disesuaikan persis dengan gambar Anda
daftar_file = [
    "boot_recovery.py",
    "camera_loader.py",
    "db_healthcheck.py",
    "db_state.py",
    "db.py",
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
    "zona_loader.py",
    
]

# Nama file hasil akhir .md
file_output = "gabungan_kode_project.md"

print("=== MEMULAI PENGGABUNGAN FILE KODE ===")

try:
    with open(file_output, "w", encoding="utf-8") as outfile:
        # Menulis judul utama di Markdown
        outfile.write("# Dokumentasi Source Code Project\n\n")
        outfile.write("Dokumen ini berisi gabungan seluruh skrip Python dalam project.\n\n")
        
        file_sukses = 0
        
        for nama_file in daftar_file:
            if os.path.exists(nama_file):
                # Membuat judul berdasarkan nama file
                outfile.write(f"## 📄 {nama_file}\n")
                outfile.write(f"Source code untuk file `{nama_file}`:\n\n")
                
                # Membuka block code Python di Markdown
                outfile.write("```python\n")
                with open(nama_file, "r", encoding="utf-8", errors="ignore") as infile:
                    outfile.write(infile.read())
                outfile.write("\n```\n\n")
                
                # Pembatas horizontal antar file
                outfile.write("---\n\n")
                print(f"✓ Berhasil memasukkan: {nama_file}")
                file_sukses += 1
            else:
                print(f"⚠️ File tidak ditemukan: {nama_file} (Dilewati)")
                
    print("\n=== PROSES SELESAI ===")
    if file_sukses > 0:
        print(f"Berhasil menggabungkan {file_sukses} file ke dalam: {os.path.abspath(file_output)}")
    else:
        print("❌ Tidak ada file yang berhasil digabungkan. Pastikan skrip ini dijalankan di folder yang sama dengan file-file di atas.")

except Exception as e:
    print(f"Terjadi kesalahan sistem: {e}")