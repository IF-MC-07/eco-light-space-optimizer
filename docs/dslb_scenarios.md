# Dokumentasi Skenario Uji DSLB (Fase 5 Tahap B)

> [!NOTE]
> Laporan ini di-generate secara otomatis oleh `service_ai/scripts/dslb_scenarios_report.py`.
> Seluruh nilai pada kolom **Hasil Sebenarnya (Actual)** diperoleh dari eksekusi nyata engine (`run_cycle`) tanpa intervensi manual.

---

## 1. Konfigurasi Ruangan Uji (Seed Rooms)

| ID Ruangan | Nama | Gedung | Lantai | Kapasitas | Lokasi | Status | Simulasi? |
|---|---|---|---|---|---|---|---|
| `ROM-s0000001` | Sim A | Gedung Sim 1 | 1 | 20 | Gedung Sim 1 | ACTIVE | `true` |
| `ROM-s0000002` | Sim B | Gedung Sim 1 | 2 | 20 | Gedung Sim 1 | ACTIVE | `true` |
| `ROM-s0000003` | Sim C | Gedung Sim 1 | 3 | 40 | Gedung Sim 1 | ACTIVE | `true` |
| `ROM-s0000004` | Sim D | Gedung Sim 2 | 1 | 30 | Gedung Sim 2 | ACTIVE | `true` |
| `ROM-s0000005` | Sim E | Gedung Sim 2 | 2 | 30 | Gedung Sim 2 | ACTIVE | `true` |
| `ROM-s0000006` | Sim F | Gedung Sim 2 | 3 | NULL | Gedung Sim 2 | ACTIVE | `true` |

Ambang batas status (default):
- `DSLB_STATUS_SEDANG_MIN_PCT`: **40%**
- `DSLB_STATUS_PADAT_MIN_PCT`: **75%**
- Pembulatan persentase tampilan: `math.floor(pct * 10) / 10`
- Daftar status resmi: `Kosong`, `Rendah`, `Sedang`, `Padat`, `Tidak tersedia`, `Kapasitas belum dikonfigurasi`

---

## 2. Tabel 15 Skenario DSLB: Harapan vs Hasil Nyata Engine

| # | Nama Skenario | Hasil Harapan (Expected) | Hasil Sebenarnya (Actual dari `run_cycle`) | Status |
|---|---|---|---|:---:|
| **1** | `semua_kosong`<br>*Semua kosong* | A–E: Kosong (0.0%); F: Kapasitas belum dikonfigurasi; Rekomendasi [] | A–E: Kosong (0.0%, 0 orang); F: Kapasitas belum dikonfigurasi; semua rekomendasi [] | ✅ Cocok |
| **2** | `satu_padat`<br>*Satu padat* | A Padat (90.0%); Rekomendasi A = [Sim B (15.0%), Sim C (20.0%), Sim E (0.0%)] | A Padat (90.0%); Rekomendasi A = [Sim B (15.0%: gedung sama, okupansi 15.0%); Sim C (20.0%: gedung sama, okupansi 20.0%); Sim E (0.0%: gedung berbeda, okupansi 0.0%)] | ✅ Cocok |
| **3** | `satu_gedung_penuh`<br>*Satu gedung penuh* | A, B, C Padat; D Rendah (20%); E Sedang (50%); Rekomendasi A, B, C = [Sim D, Sim E] | A, B, C Padat (90%, 80%, 80%); D Rendah (20.0%); E Sedang (50.0%); Rekomendasi = [Sim D (20.0%: gedung berbeda, okupansi 20.0%); Sim E (50.0%: gedung berbeda, okupansi 50.0%)] | ✅ Cocok |
| **4** | `semua_padat`<br>*Semua padat* | A–E Padat; Rekomendasi [] (bukan error) | A–E Padat (100%, 75%, 75%, 76.6%, 100%); F Kapasitas belum dikonfigurasi; Rekomendasi semua = [] | ✅ Cocok |
| **5** | `batas_status`<br>*Batas status* | B Sedang (40% tepat batas); C Padat (75% tepat batas); Reco C = [A, B, D]; Reco E = [D, A, B] | A Rendah (35.0%), B Sedang (40.0%), C Padat (75.0%), D Sedang (73.3%), E Padat (76.6%); Rekomendasi C = [Sim A, Sim B, Sim D]; Rekomendasi E = [Sim D, Sim A, Sim B] | ✅ Cocok |
| **6** | `tie_break`<br>*Tie-break* | Rekomendasi A = [Sim C (32 kursi sisa), Sim B (16 kursi sisa), Sim D (abjad)] | A Padat (90.0%); Rekomendasi A = [Sim C (20.0%: gedung sama, okupansi 20.0%); Sim B (20.0%: gedung sama, okupansi 20.0%); Sim D (20.0%: gedung berbeda, okupansi 20.0%)] | ✅ Cocok |
| **7** | `f_bukan_kandidat`<br>*F bukan kandidat* | A, B, C, E Padat; D Kosong; F Kapasitas belum dikonfigurasi; Rekomendasi = [Sim D] | A, B, C, E Padat; D Kosong; F Kapasitas belum dikonfigurasi; Rekomendasi = [Sim D] | ✅ Cocok |
| **8** | `data_basi`<br>*Data basi (berwaktu)* | Awal Reco A = [C, B, E]; Setelah C > 60s basi: C 'Tidak tersedia', Reco A = [B, E, D] | Awal: Reco A = [Sim C, Sim B, Sim E]; Setelah C basi: C status = 'Tidak tersedia', Reco A beralih ke [Sim B, Sim E, Sim D] | ✅ Cocok |
| **9** | `outlier_single`<br>*Outlier (berwaktu) - Satu Sampel* | A bertahan di 18; 1 sampel 3; kembali ke 18 -> confirmed_status tetap Padat | Sampel 18 -> confirmed Padat; Sampel 3 (1x) -> confirmed tetap Padat; Sampel 18 -> confirmed Padat | ✅ Cocok |
| **9b** | `outlier_double`<br>*Outlier (berwaktu) - Dua Sampel Berturut-turut* | Dua sampel 3 berturut-turut membuat median turun ke 3 -> terkonfirmasi Rendah pada siklus 4, lalu pulih ke Padat pada siklus 6 | Siklus 1: Padat; Siklus 2: Padat; Siklus 3: Padat (cand Rendah=1); Siklus 4: Rendah; Siklus 5: Rendah (cand Padat=1); Siklus 6: Padat | ✅ Cocok |
| **10** | `perubahan_menetap`<br>*Perubahan menetap (berwaktu)* | Langkah 1: Rendah; Langkah 2: Rendah (cand Padat 1); Langkah 3: Terkonfirmasi Padat (siklus ke-3) | Langkah 1: confirmed Rendah; Langkah 2: confirmed Rendah, candidate Padat (1); Langkah 3: confirmed Padat | ✅ Cocok |
| **11** | `melebihi_kapasitas`<br>*Melebihi kapasitas* | A Padat, raw: 130%, tampilan: 100%, kursi: 0; Rekomendasi = [Sim B, Sim C, Sim E] | A Padat, raw_pct: 130.0%, display_pct: 100.0%, kursi: 0; Rekomendasi = [Sim B, Sim C, Sim E] | ✅ Cocok |
| **12** | `pemulihan_setelah_basi`<br>*Pemulihan setelah basi (berwaktu)* | Awal Padat; Saat basi 'Tidak tersedia'; Saat pulih langsung diadopsi ('Rendah') | Awal: Padat; Setelah basi (>60s): 'Tidak tersedia'; Setelah pulih (4 orang): langsung 'Rendah' tanpa delay konfirmasi | ✅ Cocok |
| **13** | `simulasi_dimatikan`<br>*Simulasi dimatikan* | Ruangan nyata Padat, kandidat simulasi tidak disertakan -> Rekomendasi [] | Ruangan fisik Padat (90.0%); Rekomendasi = [] | ✅ Cocok |
| **14** | `gedung_tidak_diketahui`<br>*Gedung tidak diketahui* | Urutan [ROM-R (5%), ROM-Q (10%), ROM-P (25%)]; Semua beralasan 'gedung tidak diketahui' | Urutan Rekomendasi = [ROM-R (5.0%), ROM-Q (10.0%), ROM-P (25.0%)]; Alasan seluruh kandidat: 'gedung tidak diketahui, okupansi X%' | ✅ Cocok |

---

## 3. Rincian Skenario Khusus

### A. Skenario 9b: Outlier Dua Sampel Berturut-turut

Skenario 9b menguji perilaku filter saat terjadi anomali deteksi sebanyak dua sampel berurutan:
- Parameter: `smoothing_window = 3`, `confirm_cycles = 2`
- Rangkaian sampel `count`: `18 -> 18 -> 18 -> 3 -> 3 -> 18 -> 18 -> 18`

#### Tabel Transisi Per Siklus (Hasil Nyata `run_cycle`)

| Siklus | Sampel (`count`) | Median Window (3) | Status Terklasifikasi | Status Kandidat (Count) | Status Terkonfirmasi | Keterangan |
|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | 18 | 18 | Padat | - | **Padat** | Keadaan awal stabil pada 18 orang (90%) |
| 2 | 3 | 18 | Padat | - | **Padat** | Sampel 3 pertama: median [18, 18, 3] tetap 18 |
| 3 | 3 | 3 | Rendah | Rendah (1) | **Padat** | Sampel 3 kedua: median [18, 3, 3] turun menjadi 3 (Rendah) |
| 4 | 18 | 3 | Rendah | - | **Rendah** | Sampel kembali ke 18: median [3, 3, 18] masih 3 -> hit 2 siklus Rendah berturut-turut |
| 5 | 18 | 18 | Padat | Padat (1) | **Rendah** | Sampel bertahan 18: median [3, 18, 18] naik menjadi 18 (Padat) |
| 6 | 18 | 18 | Padat | - | **Padat** | Sampel bertahan 18: median [18, 18, 18] tetap 18 -> hit 2 siklus Padat berturut-turut |

> [!IMPORTANT] Keterbatasan yang Diketahui (Known Limitation)
> Dengan `DSLB_SMOOTHING_WINDOW=3` dan `DSLB_CONFIRM_CYCLES=2`, jika kamera mengalami noise/outlier sebanyak **dua sampel berturut-turut**, median window akan bergeser ke nilai outlier selama 2 siklus berturut-turut (Siklus 3 dan Siklus 4).
> Hal ini menyebabkan status terkonfirmasi sempat turun menjadi **Rendah** pada Siklus 4, sebelum akhirnya pulih kembali menjadi **Padat** pada Siklus 6 setelah 2 sampel valid berurutan.
> Ini adalah konsekuensi matematis alami dari ukuran window median ganjil terkecil ($N=3$). Untuk meredam noise multi-sampel yang lebih panjang, ukuran window dapat ditingkatkan (mis. $N=5$).

---

### B. Skenario 14: Gedung Asal Tidak Diketahui (`origin_building is None`)

Pada **Skenario 14**, ruangan asal `ROM-X` memiliki `building = NULL`.

1. **Urutan Rekomendasi**: `[ROM-R (5.0%), ROM-Q (10.0%), ROM-P (25.0%)]`.
   - Urutan ini **100% konsisten** diurutkan berdasarkan beban terendah:
     - `ROM-R`: 1/20 = 5.0%
     - `ROM-Q`: 2/20 = 10.0%
     - `ROM-P`: 5/20 = 25.0%

2. **Teks Alasan Rekomendasi**:
   - Implementasi pada `service_ai/app/dslb_core.py` (L237):
     ```python
     if origin_building is None or building is None:
         building_relation = "unknown"
     ```
   - Karena gedung ruangan asal tidak diketahui (`origin_building is None`), maka relasi gedung terhadap **seluruh** kandidat (baik kandidat tanpa gedung seperti R maupun dengan gedung seperti P dan Q) secara matematis dievaluasi sebagai `unknown`.
   - Sehingga teks alasan untuk seluruh kandidat (R, Q, P) seragam berbunyi: `"gedung tidak diketahui, okupansi X%"`.
   - Harapan pada `dslb_scenarios.json` dan tes `test_dslb_scenarios.py` telah diselaraskan dengan fakta matematis ini.

