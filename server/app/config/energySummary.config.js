/**
 * server/app/config/energySummary.config.js
 * 
 * Konfigurasi perhitungan ringkasan energi, baseline, dan ambang batas cakupan data (Tahap 2C).
 * Mengumpulkan seluruh konstanta dan ambang batas (coverage thresholds, baseline weeks, neutral band)
 * di satu tempat terpusat dengan dokumentasi lengkap.
 */

export const ENERGY_SUMMARY_CONFIG = {
  // Zona waktu operasional sistem (WIB / UTC+7)
  TIMEZONE: 'Asia/Jakarta',

  // Mode perhitungan baseline: 'fixed_pre_period' (jendela acuan tetap sebelum awal jendela evaluasi)
  // bukan bergulir ('rolling') per bucket. Menghindari distorsi pergeseran baseline di tengah periode evaluasi.
  BASELINE_MODE: 'fixed_pre_period',

  // Jumlah minggu riwayat sebelum rentang target untuk baseline pembanding
  BASELINE_WEEKS: 4,

  // Jumlah sampel minimum pada bucket yang bersesuaian agar baseline valid (bukan null)
  MIN_BASELINE_SAMPLES: 2,

  // MIN_DAY_COVERAGE (0.9): sementara, perlu justifikasi.
  // Mensyaratkan minimal 90% cakupan waktu/interval dalam satu hari kalender WIB agar data parsial/terpotong
  // (mis. awal data, hari berjalan, atau celah besar) tidak dijadikan sampel baseline yang mendistorsi perhitungan.
  MIN_DAY_COVERAGE: 0.9,

  // Ambang batas persentase delta untuk pita status netral (|delta_pct| <= 5% -> 'neutral')
  NEUTRAL_BAND_PCT: 5.0,

  // ==================== AMBANG CAKUPAN DATA (COVERAGE THRESHOLDS) ====================
  // 1. MIN_COVERAGE_RATIO (0.7):
  //    Rasio kelengkapan data minimum (days_with_data / expected_days) pada tingkat agregasi
  //    agar ringkasan energi valid. Jika coverage.ratio < 0.7, status menjadi 'insufficient_baseline'
  //    dan perbandingan delta tidak dihitung.
  MIN_COVERAGE_RATIO: 0.7,

  // 2. CRITICAL_COVERAGE_RATIO (0.5):
  //    Batas kritis ketiadaan data pada mesin penjelasan (explanation.service).
  //    Jika coverage ratio < 0.5, aturan 'insufficient_data' terpicu secara mutlak
  //    dan klaim tren performa energi ditangguhkan.
  CRITICAL_COVERAGE_RATIO: 0.5,

  // 3. TARGET_COVERAGE_RATIO (0.8):
  //    Ambang batas kualitas telemetri target (80%).
  //    Jika coverage ratio berada di bawah 0.8 meskipun di atas minimum 0.7,
  //    aturan 'coverage_warning' akan memberikan peringatan kelengkapan data telemetri.
  TARGET_COVERAGE_RATIO: 0.8,
};
