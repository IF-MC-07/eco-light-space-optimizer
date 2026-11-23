import db from '../models/index.js';
import { computeEnergyTrend, computeEnergyTrendByRoom, computeEnergyByRoom } from '../utils/energyAggregation.util.js';
import { ENERGY_SUMMARY_CONFIG } from '../config/energySummary.config.js';

export const TIMEZONE = ENERGY_SUMMARY_CONFIG.TIMEZONE || 'Asia/Jakarta';

/**
 * Mendapatkan komponen waktu (tahun, bulan, hari, jam, nama hari) dalam zona Asia/Jakarta (WIB).
 */
export function getWIBParts(dateInput) {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  // hour12: false dapat menghasilkan '24' untuk tengah malam di beberapa versi Node
  const hour = parseInt(map.hour, 10) % 24;

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour,
    weekday: map.weekday, // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    dateString: `${map.year}-${map.month}-${map.day}`,
  };
}

/**
 * Mengubah input tanggal/string menjadi awal hari kalender WIB utuh (00:00:00.000 WIB).
 * Dalam UTC, 00:00:00 WIB hari D adalah (D-1) 17:00:00.000Z.
 */
export function getWIBStartOfDay(dateInput) {
  const parts = getWIBParts(dateInput);
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000;
  return new Date(utcMs);
}

/**
 * Mengubah input tanggal/string menjadi akhir hari kalender WIB utuh (23:59:59.999 WIB).
 * Dalam UTC, 23:59:59.999 WIB hari D adalah D 16:59:59.999Z.
 */
export function getWIBEndOfDay(dateInput) {
  const parts = getWIBParts(dateInput);
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000;
  return new Date(utcMs);
}

/**
 * Mengklasifikasikan jenis hari dalam zona WIB:
 * - Akhir pekan (Sabtu atau Minggu) -> 'libur'
 * - Hari yang tercantum dalam daftar libur dengan suspend_rules = true -> 'libur'
 * - Selain itu -> 'kerja'
 *
 * @param {string|Date|number} dateInput
 * @param {Array<string|Object>|Set<string>} [holidays] Daftar tanggal libur atau objek Holiday
 * @returns {'libur'|'kerja'}
 */
export function dayType(dateInput, holidays = []) {
  const { weekday, dateString } = getWIBParts(dateInput);
  if (weekday === 'Sat' || weekday === 'Sun') {
    return 'libur';
  }

  if (holidays) {
    if (holidays instanceof Set) {
      if (holidays.has(dateString)) return 'libur';
    } else if (Array.isArray(holidays)) {
      const isHoliday = holidays.some((h) => {
        if (typeof h === 'string') return h === dateString;
        const hDate = typeof h.holiday_date === 'string'
          ? h.holiday_date.split('T')[0]
          : getWIBParts(h.holiday_date).dateString;
        return hDate === dateString && h.suspend_rules !== false;
      });
      if (isHoliday) return 'libur';
    }
  }

  return 'kerja';
}

/**
 * Memvalidasi apakah suatu rekaman riwayat memenuhi syarat sebagai sampel baseline (fungsi murni).
 * - Tidak boleh hari parsial (partial: true, is_partial: true, awal data, hari berjalan)
 * - Cakupan waktu hari itu harus >= MIN_DAY_COVERAGE (default 0.9)
 * - Tidak boleh memiliki celah data > MAX_GAP_SECONDS (has_gap: false)
 */
export function isValidBaselineSample(item, config = ENERGY_SUMMARY_CONFIG) {
  const minDayCoverage = config.MIN_DAY_COVERAGE ?? 0.9;
  const maxGapSeconds = config.MAX_GAP_SECONDS ?? 60;

  if (!item) return false;

  // 1. Cek penanda parsial eksplisit
  if (item.partial === true || item.is_partial === true) {
    return false;
  }

  // 2. Cek celah data
  if (item.has_gap === true) {
    return false;
  }
  if (item.max_gap_seconds !== undefined && Number(item.max_gap_seconds) > maxGapSeconds) {
    return false;
  }

  // 3. Cek rasio cakupan hari
  if (item.coverage_ratio !== undefined && Number(item.coverage_ratio) < minDayCoverage) {
    return false;
  }
  if (item.min_read_at && item.max_read_at) {
    const spanSec = (new Date(item.max_read_at).getTime() - new Date(item.min_read_at).getTime()) / 1000;
    if (spanSec / 86400 < minDayCoverage) {
      return false;
    }
  }

  return true;
}

/**
 * Menghitung baseline per ruangan untuk hari kerja dan hari libur secara deterministik (fungsi murni).
 * Mengabaikan sampel yang tidak valid (parsial, celah data, atau cakupan < MIN_DAY_COVERAGE).
 *
 * @param {Array<Object>} historyRecords
 * @param {Object} [config]
 * @param {Array<string|Object>} [holidays]
 * @returns {Record<string, {kerja: number|null, libur: number|null, samples: {kerja: number, libur: number}}>}
 */
export function computeRoomBaselines(
  historyRecords = [],
  config = ENERGY_SUMMARY_CONFIG,
  holidays = []
) {
  const minSamples = config.MIN_BASELINE_SAMPLES ?? 2;
  const roomBaselines = {};

  for (const r of historyRecords) {
    if (!r.room_id) continue;
    if (!isValidBaselineSample(r, config)) continue;

    if (!roomBaselines[r.room_id]) {
      roomBaselines[r.room_id] = { kerja: [], libur: [] };
    }

    const dt = r.dayType || dayType(r.bucket || r.min_read_at, holidays);
    roomBaselines[r.room_id][dt].push(Number(r.total_kwh ?? r.actual_kwh ?? 0));
  }

  const result = {};
  for (const [roomId, b] of Object.entries(roomBaselines)) {
    result[roomId] = {
      kerja:
        b.kerja.length >= minSamples
          ? Number((b.kerja.reduce((acc, c) => acc + c, 0) / b.kerja.length).toFixed(4))
          : null,
      libur:
        b.libur.length >= minSamples
          ? Number((b.libur.reduce((acc, c) => acc + c, 0) / b.libur.length).toFixed(4))
          : null,
      samples: {
        kerja: b.kerja.length,
        libur: b.libur.length,
      },
    };
  }

  return result;
}

/**
 * Mengagregasikan deret waktu gedung dari rekaman per ruangan (fungsi murni).
 * Aturan eligibilitas per ruangan:
 * Baseline, delta, dan total dihitung per pasangan (ruangan, bucket).
 * Total gedung = jumlah atas pasangan yang punya AKTUAL dan BASELINE non-null.
 * Ruangan tanpa baseline (mis. ROM-s0000003) TIDAK IKUT ke sisi aktual maupun baseline pada total gedung.
 *
 * @param {Array<Object>} currentRoomRows
 * @param {Record<string, Object>} roomBaselines
 * @param {Object} [config]
 * @param {Array<string|Object>} [holidays]
 * @returns {Array<{bucket: string, actual_kwh: number|null, baseline_kwh: number|null, partial: boolean, compared_rooms: number}>}
 */
export function aggregateBuildingSeries(
  currentRoomRows = [],
  roomBaselines = {},
  config = ENERGY_SUMMARY_CONFIG,
  holidays = []
) {
  const nowWIB = getWIBParts(new Date());

  // Kelompokkan baris ruangan per bucket
  const bucketMap = new Map();
  for (const r of currentRoomRows) {
    const bucketIso = new Date(r.bucket).toISOString();
    if (!bucketMap.has(bucketIso)) {
      bucketMap.set(bucketIso, []);
    }
    bucketMap.get(bucketIso).push(r);
  }

  const series = [];
  for (const [bucketIso, rooms] of bucketMap.entries()) {
    const parts = getWIBParts(bucketIso);
    const dt = dayType(bucketIso, holidays);

    let bucketActual = 0;
    let bucketBaseline = 0;
    let comparedRooms = 0;

    for (const r of rooms) {
      const roomBase = roomBaselines[r.room_id]?.[dt] ?? null;
      const roomAct = Number(r.total_kwh ?? r.actual_kwh ?? 0);

      // KONSISTENSI PASANGAN (RUANGAN, BUCKET):
      // Hanya pasangan yang memiliki baseline non-null yang masuk ke total gedung.
      if (roomBase !== null) {
        bucketActual += roomAct;
        bucketBaseline += roomBase;
        comparedRooms++;
      }
    }

    let isPartial = false;
    if (typeof rooms[0]?.partial === 'boolean') {
      isPartial = rooms[0].partial;
    } else {
      if (parts.dateString > nowWIB.dateString) {
        isPartial = true;
      } else if (parts.dateString === nowWIB.dateString) {
        isPartial = true;
      }
    }

    series.push({
      bucket: bucketIso,
      actual_kwh: comparedRooms > 0 ? Number(bucketActual.toFixed(4)) : null,
      baseline_kwh: comparedRooms > 0 ? Number(bucketBaseline.toFixed(4)) : null,
      partial: isPartial,
      compared_rooms: comparedRooms,
    });
  }

  series.sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());
  return series;
}

/**
 * Menghitung baseline per bucket secara deterministik (fungsi murni).
 * Mendukung data tingkat ruangan maupun tingkat agregat gedung.
 *
 * @param {Array<{bucket: string|Date, actual_kwh?: number, total_kwh?: number, room_id?: string}>} history
 * @param {Array<{bucket: string|Date, actual_kwh?: number, total_kwh?: number, partial?: boolean, room_id?: string}|string>} targetBuckets
 * @param {Object} [config]
 * @param {Array<string|Object>} [holidaysArg]
 * @returns {Array<{bucket: string, actual_kwh: number|null, baseline_kwh: number|null, partial: boolean}>}
 */
export function computeBaseline(
  history = [],
  targetBuckets = [],
  config = ENERGY_SUMMARY_CONFIG,
  holidaysArg = []
) {
  const minSamples = config.MIN_BASELINE_SAMPLES ?? 2;
  const holidays = config?.holidays || holidaysArg || [];
  const nowWIB = getWIBParts(new Date());

  // Jika masukan mengandung room_id, gunakan agregasi berbasis pasangan ruangan x bucket
  const hasRoomHistory = history.some((h) => Boolean(h.room_id));
  const hasRoomTarget = targetBuckets.some((tb) => Boolean(tb && typeof tb === 'object' && tb.room_id));

  if (hasRoomHistory && hasRoomTarget) {
    const roomBaselines = computeRoomBaselines(history, config, holidays);
    return aggregateBuildingSeries(targetBuckets, roomBaselines, config, holidays);
  }

  // Deteksi apakah target menggunakan granularitas jam atau hari
  const normalizedTargets = targetBuckets.map((tb) => {
    if (typeof tb === 'string' || tb instanceof Date) {
      return {
        bucket: new Date(tb).toISOString(),
        actual_kwh: 0,
        partial: undefined,
      };
    }
    return {
      bucket: new Date(tb.bucket).toISOString(),
      actual_kwh: tb.actual_kwh !== null && tb.actual_kwh !== undefined ? Number(tb.actual_kwh ?? tb.total_kwh ?? 0) : null,
      partial: tb.partial,
    };
  });

  // Tentukan apakah ada jam yang bervariasi pada tanggal yang sama (indikasi granularitas per jam)
  let isHourGranularity = false;
  if (normalizedTargets.length > 1) {
    const firstParts = getWIBParts(normalizedTargets[0].bucket);
    const secondParts = getWIBParts(normalizedTargets[1].bucket);
    if (firstParts.dateString === secondParts.dateString && firstParts.hour !== secondParts.hour) {
      isHourGranularity = true;
    }
  }

  // Siapkan data history terindeks dan terfilter (menyingkirkan hari parsial / celah)
  const normalizedHistory = history
    .filter((h) => isValidBaselineSample(h, config))
    .map((h) => {
      const bucketIso = new Date(h.bucket).toISOString();
      const parts = getWIBParts(bucketIso);
      return {
        bucket: bucketIso,
        kwh: Number(h.actual_kwh ?? h.total_kwh ?? 0),
        dateString: parts.dateString,
        hour: parts.hour,
        dayType: dayType(bucketIso, holidays),
      };
    });

  return normalizedTargets.map((tb) => {
    const tbParts = getWIBParts(tb.bucket);
    const tbDayType = dayType(tb.bucket, holidays);

    // Tandai hari berjalan sebagai partial bila belum didefinisikan secara eksplisit
    let isPartial = false;
    if (typeof tb.partial === 'boolean') {
      isPartial = tb.partial;
    } else {
      if (tbParts.dateString > nowWIB.dateString) {
        isPartial = true;
      } else if (tbParts.dateString === nowWIB.dateString) {
        if (isHourGranularity) {
          isPartial = tbParts.hour >= nowWIB.hour;
        } else {
          isPartial = true; // Hari kalender berjalan belum selesai
        }
      }
    }

    // Cari riwayat yang sesuai dengan tipe hari (dan jam jika granularitas jam)
    const matchingHistory = normalizedHistory.filter((h) => {
      if (h.dayType !== tbDayType) return false;
      if (isHourGranularity) {
        return h.hour === tbParts.hour;
      }
      return true;
    });

    // Kumpulkan sampel per hari unik riwayat
    const dayMap = new Map();
    for (const item of matchingHistory) {
      if (!dayMap.has(item.dateString)) {
        dayMap.set(item.dateString, []);
      }
      dayMap.get(item.dateString).push(item.kwh);
    }

    // Setiap hari unik menghasilkan satu sampel (jumlah kwh atau nilai bucket)
    const samples = [];
    for (const values of dayMap.values()) {
      const sum = values.reduce((a, b) => a + b, 0);
      samples.push(sum);
    }

    let baseline_kwh = null;
    if (samples.length >= minSamples) {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      baseline_kwh = Number(avg.toFixed(4));
    }

    return {
      bucket: tb.bucket,
      actual_kwh: tb.actual_kwh,
      baseline_kwh,
      partial: isPartial,
    };
  });
}

/**
 * Menghitung coverage rasio kelengkapan data (fungsi murni).
 * Memastikan expected_days dihitung berdasarkan jumlah hari kalender WIB utuh.
 */
export function computeCoverage(startDate, endDate, series = [], config = ENERGY_SUMMARY_CONFIG) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Hitung jumlah hari kalender unik yang diharapkan dalam zona WIB
  const expectedDaysSet = new Set();
  let cur = getWIBStartOfDay(start);
  const limit = getWIBStartOfDay(end);

  while (cur <= limit) {
    expectedDaysSet.add(getWIBParts(cur).dateString);
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  const expected_days = Math.max(1, expectedDaysSet.size);

  // Hari dengan data (> 0 kwh)
  const daysWithDataSet = new Set();
  for (const item of series) {
    if (item.actual_kwh > 0) {
      const parts = getWIBParts(item.bucket);
      daysWithDataSet.add(parts.dateString);
    }
  }
  const days_with_data = daysWithDataSet.size;
  const ratio = expected_days > 0 ? Number((days_with_data / expected_days).toFixed(4)) : 0;

  return {
    days_with_data,
    expected_days,
    ratio,
  };
}

/**
 * Mengklasifikasikan perbandingan konsumsi aktual vs baseline (fungsi murni).
 * delta_kwh = baseline - actual (positif = konsumsi lebih rendah dari baseline).
 */
export function classifyComparison(current_kwh, baseline_kwh, coverage, config = ENERGY_SUMMARY_CONFIG) {
  const minCoverageRatio = config.MIN_COVERAGE_RATIO ?? 0.7;
  const neutralBandPct = config.NEUTRAL_BAND_PCT ?? 5.0;

  if (
    current_kwh === null ||
    current_kwh === undefined ||
    baseline_kwh === null ||
    baseline_kwh === undefined ||
    !coverage ||
    coverage.ratio < minCoverageRatio
  ) {
    return {
      delta_kwh: null,
      delta_pct: null,
      status: 'insufficient_baseline',
    };
  }

  const delta_kwh = Number((baseline_kwh - current_kwh).toFixed(4));
  const delta_pct = baseline_kwh > 0
    ? Number(((delta_kwh / baseline_kwh) * 100).toFixed(2))
    : 0;

  let status = 'neutral';
  if (Math.abs(delta_pct) <= neutralBandPct) {
    status = 'neutral';
  } else if (delta_kwh > 0) {
    status = 'saving';
  } else {
    status = 'waste';
  }

  return {
    delta_kwh,
    delta_pct,
    status,
  };
}

/**
 * Menghitung ringkasan konsumsi dan baseline energi dengan konsistensi total bucket (Tahap 2C).
 * - totals.current_kwh, baseline_kwh, delta_kwh, delta_pct dihitung HANYA pada bucket
 *   yang memiliki nilai aktual DAN baseline non-null.
 * - Hari berjalan ditandai partial dan tidak diikutsertakan dalam total perbandingan kecuali diminta.
 * - Menambahkan totals.compared_buckets dan totals.total_buckets.
 */
export async function getEnergySummary({
  from,
  to,
  granularity = 'day',
  roomId = null,
  config = ENERGY_SUMMARY_CONFIG,
  includeSimulated = false,
  include_simulated,
  includePartial = false,
  include_partial,
}) {
  const isIncludeSimulated = includeSimulated || include_simulated === true;
  const isIncludePartial = includePartial || include_partial === true;

  const rawFrom = new Date(from);
  const rawTo = new Date(to);

  if (isNaN(rawFrom.getTime()) || isNaN(rawTo.getTime())) {
    throw new Error('Format tanggal from atau to tidak valid');
  }

  // Jendela waktu: Hari kalender WIB utuh untuk granularitas hari
  let fromDate = rawFrom;
  let toDate = rawTo;
  if (granularity === 'day') {
    fromDate = getWIBStartOfDay(rawFrom);
    toDate = getWIBEndOfDay(rawTo);
  }

  const baselineWeeks = config.BASELINE_WEEKS ?? 4;
  const historyStartDate = new Date(fromDate.getTime() - baselineWeeks * 7 * 24 * 60 * 60 * 1000);

  // 1. Ambil data tren energi per ruangan dan bucket untuk periode target dan riwayat acuan (Tahap 2D)
  const [currentRoomTrend, historyRoomTrend, activeHolidays] = await Promise.all([
    computeEnergyTrendByRoom(db.sequelize, fromDate, toDate, granularity, roomId, isIncludeSimulated),
    computeEnergyTrendByRoom(db.sequelize, historyStartDate, fromDate, granularity, roomId, isIncludeSimulated),
    db.Holiday
      ? db.Holiday.findAll({
          where: { suspend_rules: true },
          attributes: ['holiday_date', 'suspend_rules'],
          raw: true,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const holidays = config?.holidays || activeHolidays || [];

  // 2. Hitung baseline per ruangan dan per tipe hari (kerja / libur)
  const roomBaselines = computeRoomBaselines(historyRoomTrend, config, holidays);

  // 3. Agregasi total gedung per bucket dengan eligibilitas per pasangan (ruangan, bucket):
  // Total gedung hanya menjumlahkan pasangan yang memiliki aktual DAN baseline non-null.
  // Ruangan tanpa baseline (mis. ROM-s0000003) tidak ikut ke sisi aktual maupun baseline total.
  const series = aggregateBuildingSeries(currentRoomTrend, roomBaselines, config, holidays);

  // 4. Hitung coverage data
  const coverage = computeCoverage(fromDate, toDate, series, config);

  // 5. Hitung total periode secara konsisten:
  // HANYA pada bucket yang memiliki aktual DAN baseline non-null.
  // Hari berjalan (partial: true) dilewati kecuali isIncludePartial = true.
  const eligibleBuckets = series.filter((s) => {
    if (s.partial && !isIncludePartial) {
      return false;
    }
    return (
      s.actual_kwh !== null &&
      s.actual_kwh !== undefined &&
      s.baseline_kwh !== null &&
      s.baseline_kwh !== undefined
    );
  });

  const compared_buckets = eligibleBuckets.length;
  const total_buckets = series.length;

  let current_kwh = null;
  let baseline_kwh = null;

  if (compared_buckets > 0) {
    current_kwh = Number(eligibleBuckets.reduce((acc, s) => acc + s.actual_kwh, 0).toFixed(4));
    baseline_kwh = Number(eligibleBuckets.reduce((acc, s) => acc + s.baseline_kwh, 0).toFixed(4));
  }

  // 6. Klasifikasikan status
  const { delta_kwh, delta_pct, status } = classifyComparison(
    current_kwh,
    baseline_kwh,
    coverage,
    config
  );

  const roomWhere = {};
  if (roomId) {
    roomWhere.room_id = roomId;
  }
  if (!isIncludeSimulated) {
    roomWhere.is_simulated = false;
  }

  // 7. Rincian per ruangan (by_room)
  const allRooms = await db.Room.findAll({
    where: roomWhere,
    attributes: ['room_id', 'room_name', 'is_simulated'],
    order: [['room_id', 'ASC']],
    raw: true,
  });

  const currentByRoomMap = new Map();
  for (const r of currentRoomTrend) {
    if (!currentByRoomMap.has(r.room_id)) {
      currentByRoomMap.set(r.room_id, []);
    }
    currentByRoomMap.get(r.room_id).push(r);
  }

  const by_room = allRooms.map((room) => {
    const roomCurrentRows = currentByRoomMap.get(room.room_id) || [];
    if (!roomCurrentRows.length) {
      return {
        room_id: room.room_id,
        room_name: room.room_name,
        is_simulated: room.is_simulated ?? false,
        actual_kwh: null,
        baseline_kwh: null,
        delta_kwh: null,
        has_sensor: false,
      };
    }

    const actual_kwh = Number(
      roomCurrentRows.reduce((acc, r) => acc + Number(r.total_kwh || 0), 0).toFixed(4)
    );

    const baseInfo = roomBaselines[room.room_id];
    let room_baseline_kwh = null;

    if (baseInfo && (baseInfo.kerja !== null || baseInfo.libur !== null)) {
      let bSum = 0;
      let validBuckets = 0;
      for (const cr of roomCurrentRows) {
        const dt = dayType(cr.bucket, holidays);
        const bVal = dt === 'kerja' ? baseInfo.kerja : baseInfo.libur;
        if (bVal !== null) {
          bSum += bVal;
          validBuckets++;
        }
      }
      if (validBuckets > 0) {
        room_baseline_kwh = Number(bSum.toFixed(4));
      }
    }

    const room_delta_kwh = room_baseline_kwh !== null
      ? Number((room_baseline_kwh - actual_kwh).toFixed(4))
      : null;

    return {
      room_id: room.room_id,
      room_name: room.room_name,
      is_simulated: room.is_simulated ?? false,
      actual_kwh,
      baseline_kwh: room_baseline_kwh,
      delta_kwh: room_delta_kwh,
      has_sensor: true,
    };
  });

  // Hitung jumlah sampel acuan yang digunakan per tipe hari
  let totalKerjaSamples = 0;
  let totalLiburSamples = 0;
  for (const b of Object.values(roomBaselines)) {
    totalKerjaSamples += b.samples?.kerja || 0;
    totalLiburSamples += b.samples?.libur || 0;
  }

  return {
    series,
    totals: {
      current_kwh,
      baseline_kwh,
      delta_kwh,
      delta_pct,
      status,
      coverage,
      compared_buckets,
      total_buckets,
    },
    by_room,
    meta: {
      baseline_mode: config.BASELINE_MODE || 'fixed_pre_period',
      baseline_samples: {
        kerja: totalKerjaSamples,
        libur: totalLiburSamples,
      },
      baseline_weeks: baselineWeeks,
      generated_at: new Date().toISOString(),
      include_simulated: isIncludeSimulated,
      include_partial: isIncludePartial,
    },
  };
}
