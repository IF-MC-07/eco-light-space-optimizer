import { describe, it, expect } from '@jest/globals';
import {
  dayType,
  getWIBParts,
  getWIBStartOfDay,
  getWIBEndOfDay,
  computeBaseline,
  computeRoomBaselines,
  aggregateBuildingSeries,
  isValidBaselineSample,
  classifyComparison,
  computeCoverage,
} from '../../../app/services/energySummary.service.js';
import { ENERGY_SUMMARY_CONFIG } from '../../../app/config/energySummary.config.js';

describe('EnergySummaryService Pure Functions', () => {
  const testConfig = {
    ...ENERGY_SUMMARY_CONFIG,
    MIN_BASELINE_SAMPLES: 2,
    MIN_COVERAGE_RATIO: 0.7,
    NEUTRAL_BAND_PCT: 5.0,
  };

  describe('1. Baseline cukup', () => {
    it('menghasilkan rata-rata baseline yang valid bila sampel >= MIN_BASELINE_SAMPLES', () => {
      // 3 sampel hari kerja (Senin 3 minggu berturut-turut)
      const history = [
        { bucket: '2026-10-26T02:00:00.000Z', actual_kwh: 10.0 }, // Senin W1 (09:00 WIB)
        { bucket: '2026-11-02T02:00:00.000Z', actual_kwh: 12.0 }, // Senin W2 (09:00 WIB)
        { bucket: '2026-11-09T02:00:00.000Z', actual_kwh: 14.0 }, // Senin W3 (09:00 WIB)
      ];

      const target = [
        { bucket: '2026-11-16T02:00:00.000Z', actual_kwh: 11.0 }, // Senin Target (09:00 WIB)
      ];

      const result = computeBaseline(history, target, testConfig);

      expect(result).toHaveLength(1);
      expect(result[0].baseline_kwh).toBeCloseTo(12.0, 4); // (10 + 12 + 14) / 3 = 12.0
      expect(result[0].actual_kwh).toBe(11.0);
    });
  });

  describe('2. Sampel kurang -> null', () => {
    it('menghasilkan baseline_kwh = null bila sampel di bawah MIN_BASELINE_SAMPLES', () => {
      // Hanya 1 sampel hari kerja
      const history = [
        { bucket: '2026-11-09T02:00:00.000Z', actual_kwh: 15.0 }, // Senin W3
      ];

      const target = [
        { bucket: '2026-11-16T02:00:00.000Z', actual_kwh: 12.0 }, // Senin Target
      ];

      const result = computeBaseline(history, target, testConfig);

      expect(result).toHaveLength(1);
      expect(result[0].baseline_kwh).toBeNull();
      expect(result[0].actual_kwh).toBe(12.0);
    });
  });

  describe('3. Hari kerja tidak bercampur akhir pekan', () => {
    it('memisahkan sampel weekday dan weekend secara ketat', () => {
      // History: 2 hari kerja (Senin, Selasa) dan 2 akhir pekan (Sabtu, Minggu)
      const history = [
        { bucket: '2026-11-02T02:00:00.000Z', actual_kwh: 20.0 }, // Senin (kerja)
        { bucket: '2026-11-03T02:00:00.000Z', actual_kwh: 22.0 }, // Selasa (kerja)
        { bucket: '2026-11-07T02:00:00.000Z', actual_kwh: 5.0 },  // Sabtu (libur)
        { bucket: '2026-11-08T02:00:00.000Z', actual_kwh: 7.0 },  // Minggu (libur)
      ];

      const targets = [
        { bucket: '2026-11-16T02:00:00.000Z', actual_kwh: 18.0 }, // Senin (kerja)
        { bucket: '2026-11-21T02:00:00.000Z', actual_kwh: 6.0 },  // Sabtu (libur)
      ];

      const result = computeBaseline(history, targets, testConfig);

      expect(result).toHaveLength(2);
      // Weekday baseline: rata-rata hari kerja saja = (20 + 22) / 2 = 21.0
      expect(result[0].baseline_kwh).toBeCloseTo(21.0, 4);
      // Weekend baseline: rata-rata akhir pekan saja = (5 + 7) / 2 = 6.0
      expect(result[1].baseline_kwh).toBeCloseTo(6.0, 4);
    });
  });

  describe('4. Coverage rendah -> insufficient_baseline', () => {
    it('mengembalikan status insufficient_baseline jika coverage.ratio < MIN_COVERAGE_RATIO', () => {
      const coverageLow = {
        days_with_data: 2,
        expected_days: 7,
        ratio: 2 / 7, // ~0.2857 < 0.7
      };

      const comparison = classifyComparison(50.0, 60.0, coverageLow, testConfig);

      expect(comparison.status).toBe('insufficient_baseline');
      expect(comparison.delta_kwh).toBeNull();
      expect(comparison.delta_pct).toBeNull();
    });

    it('mengembalikan status insufficient_baseline jika baseline_kwh bernilai null', () => {
      const coverageGood = {
        days_with_data: 7,
        expected_days: 7,
        ratio: 1.0,
      };

      const comparison = classifyComparison(50.0, null, coverageGood, testConfig);

      expect(comparison.status).toBe('insufficient_baseline');
      expect(comparison.delta_kwh).toBeNull();
      expect(comparison.delta_pct).toBeNull();
    });
  });

  describe('5. Delta dan persen', () => {
    const fullCoverage = { days_with_data: 7, expected_days: 7, ratio: 1.0 };

    it('menghitung saving saat delta positif melebihi band netral (> 5%)', () => {
      // baseline = 100, actual = 80 -> delta = +20 (+20%)
      const comparison = classifyComparison(80.0, 100.0, fullCoverage, testConfig);

      expect(comparison.delta_kwh).toBe(20.0);
      expect(comparison.delta_pct).toBe(20.0);
      expect(comparison.status).toBe('saving');
    });

    it('menghitung waste saat delta negatif melebihi band netral (< -5%)', () => {
      // baseline = 100, actual = 120 -> delta = -20 (-20%)
      const comparison = classifyComparison(120.0, 100.0, fullCoverage, testConfig);

      expect(comparison.delta_kwh).toBe(-20.0);
      expect(comparison.delta_pct).toBe(-20.0);
      expect(comparison.status).toBe('waste');
    });

    it('menghitung neutral saat |delta_pct| <= 5%', () => {
      // baseline = 100, actual = 98 -> delta = +2 (+2%)
      const comp1 = classifyComparison(98.0, 100.0, fullCoverage, testConfig);
      expect(comp1.status).toBe('neutral');

      // baseline = 100, actual = 103 -> delta = -3 (-3%)
      const comp2 = classifyComparison(103.0, 100.0, fullCoverage, testConfig);
      expect(comp2.status).toBe('neutral');
    });
  });

  describe('6. Batas tengah malam WIB', () => {
    it('memproses pergantian tanggal WIB dengan tepat (17:00 UTC = 00:00 WIB hari berikutnya)', () => {
      // Jumat 20 Nov 2026, 23:59:59 WIB = 2026-11-20T16:59:59.000Z (kerja)
      const fridayNightUTC = '2026-11-20T16:59:59.000Z';
      const fridayParts = getWIBParts(fridayNightUTC);
      expect(fridayParts.weekday).toBe('Fri');
      expect(fridayParts.hour).toBe(23);
      expect(dayType(fridayNightUTC)).toBe('kerja');

      // Sabtu 21 Nov 2026, 00:00:00 WIB = 2026-11-20T17:00:00.000Z (libur)
      const saturdayMidnightUTC = '2026-11-20T17:00:00.000Z';
      const satParts = getWIBParts(saturdayMidnightUTC);
      expect(satParts.weekday).toBe('Sat');
      expect(satParts.hour).toBe(0);
      expect(satParts.dateString).toBe('2026-11-21');
      expect(dayType(saturdayMidnightUTC)).toBe('libur');
    });
  });

  describe('7. Ruangan tanpa sensor', () => {
    it('memastikan format ruangan tanpa sensor adalah has_sensor=false dan actual_kwh=null', () => {
      // Simulasi logika by_room:
      const allRooms = [
        { room_id: 'R01', room_name: 'Lab IoT' },
        { room_id: 'R02', room_name: 'Gudang Tanpa Sensor' },
      ];
      const sensorReadings = [{ room_id: 'R01', total_kwh: 45.2 }];

      const currentRoomMap = new Map();
      for (const r of sensorReadings) {
        currentRoomMap.set(r.room_id, r.total_kwh);
      }

      const byRoomResult = allRooms.map((room) => {
        const has_sensor = currentRoomMap.has(room.room_id);
        if (!has_sensor) {
          return {
            room_id: room.room_id,
            room_name: room.room_name,
            actual_kwh: null,
            baseline_kwh: null,
            delta_kwh: null,
            has_sensor: false,
          };
        }
        const actual_kwh = currentRoomMap.get(room.room_id);
        return {
          room_id: room.room_id,
          room_name: room.room_name,
          actual_kwh,
          baseline_kwh: 50.0,
          delta_kwh: 4.8,
          has_sensor: true,
        };
      });

      const uninstrumented = byRoomResult.find((r) => r.room_id === 'R02');
      expect(uninstrumented).toBeDefined();
      expect(uninstrumented.has_sensor).toBe(false);
      expect(uninstrumented.actual_kwh).toBeNull();
      expect(uninstrumented.baseline_kwh).toBeNull();
      expect(uninstrumented.delta_kwh).toBeNull();

      const instrumented = byRoomResult.find((r) => r.room_id === 'R01');
      expect(instrumented).toBeDefined();
      expect(instrumented.has_sensor).toBe(true);
      expect(instrumented.actual_kwh).toBe(45.2);
    });
  });

  describe('8. Klasifikasi jenis hari (dayType) & integrasi hari libur', () => {
    it('mengembalikan "libur" untuk akhir pekan (Sabtu dan Minggu)', () => {
      expect(dayType('2026-11-07T05:00:00.000Z')).toBe('libur'); // Sabtu
      expect(dayType('2026-11-08T05:00:00.000Z')).toBe('libur'); // Minggu
    });

    it('mengembalikan "kerja" untuk hari kerja biasa tanpa libur', () => {
      expect(dayType('2026-11-02T05:00:00.000Z')).toBe('kerja'); // Senin
      expect(dayType('2026-11-04T05:00:00.000Z')).toBe('kerja'); // Rabu
    });

    it('mengembalikan "libur" untuk hari kerja yang ada dalam holidays dengan suspend_rules=true', () => {
      const holidays = [
        { holiday_date: '2026-11-02', name: 'Libur Uji Coba', suspend_rules: true },
        '2026-11-04',
      ];

      expect(dayType('2026-11-02T05:00:00.000Z', holidays)).toBe('libur');
      expect(dayType('2026-11-04T05:00:00.000Z', holidays)).toBe('libur');
    });

    it('mengembalikan "kerja" untuk hari kerja yang ada dalam holidays dengan suspend_rules=false', () => {
      const holidays = [
        { holiday_date: '2026-11-02', name: 'Hari Biasa Tak Ditangguhkan', suspend_rules: false },
      ];

      expect(dayType('2026-11-02T05:00:00.000Z', holidays)).toBe('kerja');
    });

    it('computeBaseline memperlakukan hari libur sebagai jenis hari libur', () => {
      // 2026-11-04 (Rabu) dijadikan hari libur
      const holidays = [{ holiday_date: '2026-11-04', suspend_rules: true }];

      const history = [
        { bucket: '2026-10-21T02:00:00.000Z', actual_kwh: 25.0 }, // Rabu biasa (kerja)
        { bucket: '2026-10-28T02:00:00.000Z', actual_kwh: 23.0 }, // Rabu biasa (kerja)
        { bucket: '2026-10-24T02:00:00.000Z', actual_kwh: 5.0 },  // Sabtu (libur)
        { bucket: '2026-10-25T02:00:00.000Z', actual_kwh: 5.5 },  // Minggu (libur)
      ];

      // Target pada hari libur Rabu 2026-11-04
      const target = [{ bucket: '2026-11-04T02:00:00.000Z', actual_kwh: 4.8 }];

      const result = computeBaseline(history, target, testConfig, holidays);

      expect(result).toHaveLength(1);
      // Baseline harus mencocokkan sampel "libur" (Sabtu & Minggu = (5.0 + 5.5) / 2 = 5.25), bukan sampel hari kerja (~24.0)
      expect(result[0].baseline_kwh).toBeCloseTo(5.25, 2);
    });
  });

  describe('9. Konsistensi total (Tahap 2C): hanya bucket dengan aktual & baseline non-null', () => {
    it('memastikan total current_kwh dan baseline_kwh memakai himpunan bucket yang identik saat beberapa baseline null', () => {
      // 5 bucket sintetis: bucket 2 dan 4 memiliki baseline null
      const series = [
        { bucket: '2026-11-10T00:00:00.000Z', actual_kwh: 10.0, baseline_kwh: 12.0, partial: false },
        { bucket: '2026-11-11T00:00:00.000Z', actual_kwh: 15.0, baseline_kwh: null, partial: false }, // baseline null
        { bucket: '2026-11-12T00:00:00.000Z', actual_kwh: 8.0, baseline_kwh: 10.0, partial: false },
        { bucket: '2026-11-13T00:00:00.000Z', actual_kwh: 20.0, baseline_kwh: null, partial: false }, // baseline null
        { bucket: '2026-11-14T00:00:00.000Z', actual_kwh: 5.0, baseline_kwh: 6.0, partial: false },
      ];

      // Simulasi aturan kalkulasi total Tahap 2C
      const eligible = series.filter(
        (s) => !s.partial && s.actual_kwh !== null && s.baseline_kwh !== null
      );

      const compared_buckets = eligible.length;
      const total_buckets = series.length;

      const current_kwh = Number(eligible.reduce((acc, s) => acc + s.actual_kwh, 0).toFixed(4));
      const baseline_kwh = Number(eligible.reduce((acc, s) => acc + s.baseline_kwh, 0).toFixed(4));
      const delta_kwh = Number((baseline_kwh - current_kwh).toFixed(4));
      const delta_pct = Number(((delta_kwh / baseline_kwh) * 100).toFixed(2));

      // Bucket yang dibandingkan hanya bucket 0, 2, dan 4 (3 bucket)
      expect(compared_buckets).toBe(3);
      expect(total_buckets).toBe(5);

      // current_kwh = 10.0 + 8.0 + 5.0 = 23.0 (bukan 58.0 yang mencakup baris tanpa baseline)
      expect(current_kwh).toBe(23.0);
      // baseline_kwh = 12.0 + 10.0 + 6.0 = 28.0
      expect(baseline_kwh).toBe(28.0);
      // delta = 28.0 - 23.0 = +5.0 kWh (+17.86% saving)
      expect(delta_kwh).toBe(5.0);
      expect(delta_pct).toBeCloseTo(17.86, 2);
    });
  });

  describe('10. Jendela waktu kalender WIB utuh & penandaan partial (Tahap 2C)', () => {
    it('menghitung expected_days = 7 untuk jendela waktu 7 hari kalender WIB utuh', () => {
      // 7 hari kalender: 16 Nov 2026 s/d 22 Nov 2026
      const start = '2026-11-16T00:00:00.000Z'; // 07:00 WIB
      const end = '2026-11-22T16:59:59.999Z';   // 23:59:59 WIB

      const coverage = computeCoverage(start, end, [
        { bucket: '2026-11-16T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-17T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-18T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-19T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-20T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-21T02:00:00.000Z', actual_kwh: 10 },
        { bucket: '2026-11-22T02:00:00.000Z', actual_kwh: 10 },
      ]);

      expect(coverage.expected_days).toBe(7);
      expect(coverage.days_with_data).toBe(7);
      expect(coverage.ratio).toBe(1.0);
    });

    it('mengecualikan bucket partial dari total perbandingan secara default dan menyertakannya bila diminta', () => {
      const series = [
        { bucket: '2026-11-16T00:00:00.000Z', actual_kwh: 10.0, baseline_kwh: 10.0, partial: false },
        { bucket: '2026-11-17T00:00:00.000Z', actual_kwh: 10.0, baseline_kwh: 10.0, partial: false },
        { bucket: '2026-11-18T00:00:00.000Z', actual_kwh: 2.0, baseline_kwh: 10.0, partial: true }, // Hari berjalan (partial)
      ];

      // Default (include_partial = false): hari partial dilewati
      const eligibleDefault = series.filter(
        (s) => !s.partial && s.actual_kwh !== null && s.baseline_kwh !== null
      );
      expect(eligibleDefault).toHaveLength(2);
      const totalCurrentDefault = eligibleDefault.reduce((a, b) => a + b.actual_kwh, 0);
      const totalBaselineDefault = eligibleDefault.reduce((a, b) => a + b.baseline_kwh, 0);
      expect(totalCurrentDefault).toBe(20.0);
      expect(totalBaselineDefault).toBe(20.0);

      // Bila diminta (include_partial = true)
      const eligibleWithPartial = series.filter(
        (s) => s.actual_kwh !== null && s.baseline_kwh !== null
      );
      expect(eligibleWithPartial).toHaveLength(3);
      const totalCurrentWithPartial = eligibleWithPartial.reduce((a, b) => a + b.actual_kwh, 0);
      expect(totalCurrentWithPartial).toBe(22.0);
    });

    it('getWIBStartOfDay dan getWIBEndOfDay menghasilkan batas kalender WIB yang presisi', () => {
      // 2026-11-20 12:00 WIB
      const testDate = '2026-11-20T05:00:00.000Z';
      const start = getWIBStartOfDay(testDate);
      const end = getWIBEndOfDay(testDate);

      // Awal hari WIB: 00:00:00 WIB = 17:00:00Z hari sebelumnya
      expect(start.toISOString()).toBe('2026-11-19T17:00:00.000Z');
      expect(getWIBParts(start).dateString).toBe('2026-11-20');
      expect(getWIBParts(start).hour).toBe(0);

      // Akhir hari WIB: 23:59:59.999 WIB = 16:59:59.999Z hari tersebut
      expect(end.toISOString()).toBe('2026-11-20T16:59:59.999Z');
      expect(getWIBParts(end).dateString).toBe('2026-11-20');
      expect(getWIBParts(end).hour).toBe(23);
    });
  });

  describe('11. Integritas Baseline per Ruangan & Hari Sampel Valid (Tahap 2D)', () => {
    it('(a) ruangan yang hanya punya aktual tidak memengaruhi kedua total (actual dan baseline gedung)', () => {
      // Room 1: punya riwayat baseline (2 hari kerja) -> baseline = 10.0
      // Room 2 (mis. ROM-s0000003): tidak punya riwayat baseline -> baseline = null
      const history = [
        { room_id: 'ROM-1', bucket: '2026-11-02T02:00:00.000Z', total_kwh: 10.0, dayType: 'kerja' },
        { room_id: 'ROM-1', bucket: '2026-11-03T02:00:00.000Z', total_kwh: 10.0, dayType: 'kerja' },
      ];

      // Target bucket: Room 1 konsumsi 9.0 kWh, Room 2 konsumsi 50.0 kWh (aktual tinggi tanpa baseline)
      const targetBuckets = [
        { room_id: 'ROM-1', bucket: '2026-11-16T02:00:00.000Z', total_kwh: 9.0, dayType: 'kerja', partial: false },
        { room_id: 'ROM-2', bucket: '2026-11-16T02:00:00.000Z', total_kwh: 50.0, dayType: 'kerja', partial: false },
      ];

      const roomBaselines = computeRoomBaselines(history, testConfig);
      expect(roomBaselines['ROM-1'].kerja).toBe(10.0);
      expect(roomBaselines['ROM-2']).toBeUndefined(); // Room 2 tidak punya baseline

      const series = aggregateBuildingSeries(targetBuckets, roomBaselines, testConfig);
      expect(series).toHaveLength(1);

      // Total gedung HANYA menjumlahkan pasangan yang memiliki baseline non-null (hanya ROM-1)
      // ROM-2 dengan 50.0 kWh aktual TIDAK IKUT ke sisi aktual maupun baseline!
      expect(series[0].actual_kwh).toBe(9.0); // bukan 59.0
      expect(series[0].baseline_kwh).toBe(10.0);
      expect(series[0].compared_rooms).toBe(1);
    });

    it('(b) hari parsial di riwayat tidak menurunkan baseline', () => {
      // 2 hari penuh (10.0 kWh dan 10.0 kWh) dengan coverage penuh
      // 1 hari parsial (awal data / potongan, mis. 5.0 kWh dengan coverage 0.5 < 0.9 MIN_DAY_COVERAGE)
      const history = [
        {
          bucket: '2026-11-02T00:00:00.000Z',
          actual_kwh: 10.0,
          coverage_ratio: 1.0,
        },
        {
          bucket: '2026-11-03T00:00:00.000Z',
          actual_kwh: 10.0,
          coverage_ratio: 1.0,
        },
        {
          bucket: '2026-11-04T00:00:00.000Z',
          actual_kwh: 5.0, // Hari parsial: konsumsi tampak rendah separuh
          coverage_ratio: 0.5, // 50% cakupan < 0.9
        },
      ];

      const targets = [
        { bucket: '2026-11-16T00:00:00.000Z', actual_kwh: 9.5 },
      ];

      const result = computeBaseline(history, targets, testConfig);

      // Hari parsial wajib disaring keluar sehingga baseline tetap (10 + 10) / 2 = 10.0
      // Bukan (10 + 10 + 5) / 3 = 8.3333 yang mendistorsi baseline
      expect(result[0].baseline_kwh).toBe(10.0);
    });

    it('(c) hari dengan celah tidak menjadi sampel', () => {
      // 2 hari normal (12.0 kWh dan 12.0 kWh, gap <= MAX_GAP)
      // 1 hari dengan celah data besar > MAX_GAP (has_gap: true atau max_gap_seconds: 7200)
      const history = [
        {
          bucket: '2026-11-02T00:00:00.000Z',
          actual_kwh: 12.0,
          has_gap: false,
          max_gap_seconds: 20,
        },
        {
          bucket: '2026-11-03T00:00:00.000Z',
          actual_kwh: 12.0,
          has_gap: false,
          max_gap_seconds: 20,
        },
        {
          bucket: '2026-11-04T00:00:00.000Z',
          actual_kwh: 6.0,
          has_gap: true, // Ada celah data > 60s
          max_gap_seconds: 7200,
        },
      ];

      const targets = [
        { bucket: '2026-11-16T00:00:00.000Z', actual_kwh: 11.0 },
      ];

      const result = computeBaseline(history, targets, testConfig);

      // Hari bercelah ditolak dari sampel baseline, baseline tetap (12 + 12) / 2 = 12.0
      expect(result[0].baseline_kwh).toBe(12.0);
    });
  });
});
