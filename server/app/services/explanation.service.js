/**
 * server/app/services/explanation.service.js
 * Pure service for rule-based explanation of energy comparison summaries.
 */

import { ENERGY_SUMMARY_CONFIG } from '../config/energySummary.config.js';

export const texts = {
  insufficient_data: {
    title: 'Data Belum Cukup',
    message: (p) =>
      `Data riwayat energi (${p.days_with_data}/${p.expected_days} hari, rasio ${(p.coverage_pct).toFixed(0)}%) belum memenuhi syarat baseline minimum (${(p.min_coverage_pct).toFixed(0)}%).`,
    recommendation:
      'Lanjutkan pengumpulan data telemetri sensor hingga periode baseline mencukupi untuk analisis yang valid.',
  },
  saving: {
    title: 'Penghematan Energi Terdeteksi',
    message: (p) =>
      `Konsumsi aktual (${p.current_kwh} kWh) lebih rendah ${p.delta_kwh} kWh (-${p.delta_pct}%) dibandingkan baseline (${p.baseline_kwh} kWh).`,
    recommendation:
      'Pertahankan aturan otomasi saat ini dan replikasi jadwal efisiensi ke zona ruangan lainnya.',
  },
  waste: {
    title: 'Konsumsi Di Atas Baseline',
    message: (p) =>
      `Konsumsi aktual (${p.current_kwh} kWh) melebihi baseline (${p.baseline_kwh} kWh) sebesar ${p.delta_kwh} kWh (+${p.delta_pct}%).`,
    recommendation:
      'Tinjau kembali jadwal otomasi AC & lampu, pastikan suhu AC diatur ke 24°C, dan aktifkan sensor okupansi.',
  },
  neutral: {
    title: 'Konsumsi Stabil / Netral',
    message: (p) =>
      `Konsumsi aktual (${p.current_kwh} kWh) berada dalam rentang toleransi netral (±${p.neutral_threshold_pct}%) terhadap baseline (${p.baseline_kwh} kWh).`,
    recommendation:
      'Terapkan batas peredupan cahaya sekitar untuk mengoptimalkan efisiensi energi lebih lanjut.',
  },
  top_room_deviation: {
    title: 'Deviasi Terbesar Ruangan',
    message: (p) =>
      `Ruangan ${p.room_name} menyumbang selisih terbesar yaitu ${p.room_delta_kwh} kWh (${p.share_pct}% dari total deviasi ruangan).`,
    recommendation: (p) =>
      `Fokuskan audit konsumsi dan penyesuaian aturan otomasi pertama pada ruangan ${p.room_name}.`,
  },
  coverage_warning: {
    title: 'Peringatan Kelengkapan Sensor & Data',
    message: (p) =>
      p.unmonitored_count > 0
        ? `${p.unmonitored_count} ruangan belum memiliki sensor aktif (${p.low_coverage_rooms}).`
        : `Kelengkapan data periode ini (${((p.coverage_ratio || 0) * 100).toFixed(0)}%) berada di bawah ambang target (${((p.threshold || 0.8) * 100).toFixed(0)}%).`,
    recommendation:
      'Pasang sensor daya pada ruangan tanpa telemetri atau periksa keandalan transmisi data IoT.',
  },
};

/**
 * Pure rule engine that builds an array of insights from an energy summary.
 * @param {Object} summary - Result from getEnergySummary
 * @param {Object} config - Configuration thresholds
 * @returns {Array} List of insight objects
 */
export function buildExplanation(summary, config = {}) {
  const insights = [];
  if (!summary || !summary.totals) {
    return insights;
  }

  const {
    minCoverageRatio = ENERGY_SUMMARY_CONFIG.CRITICAL_COVERAGE_RATIO ?? 0.5,
    neutralThresholdPct = ENERGY_SUMMARY_CONFIG.NEUTRAL_BAND_PCT ?? 5.0,
    lowCoverageThreshold = ENERGY_SUMMARY_CONFIG.TARGET_COVERAGE_RATIO ?? 0.8,
  } = config;

  const totals = summary.totals;
  const coverage = totals.coverage || { days_with_data: 0, expected_days: 0, ratio: 0 };
  const byRoom = Array.isArray(summary.by_room) ? summary.by_room : [];

  const isInsufficient =
    totals.status === 'insufficient_baseline' ||
    totals.baseline_kwh === null ||
    coverage.ratio < minCoverageRatio;

  // Rule 1: insufficient_data
  if (isInsufficient) {
    const params = {
      days_with_data: coverage.days_with_data || 0,
      expected_days: coverage.expected_days || 0,
      coverage_pct: (coverage.ratio || 0) * 100,
      min_coverage_pct: minCoverageRatio * 100,
    };
    insights.push({
      rule_id: 'insufficient_data',
      severity: 'info',
      text_key: 'insufficient_data',
      title: texts.insufficient_data.title,
      message: typeof texts.insufficient_data.message === 'function'
        ? texts.insufficient_data.message(params)
        : texts.insufficient_data.message,
      recommendation: texts.insufficient_data.recommendation,
      params,
      evidence: {
        rule_id: 'insufficient_data',
        status: totals.status,
        coverage_ratio: coverage.ratio,
        days_with_data: coverage.days_with_data,
        expected_days: coverage.expected_days,
        threshold: minCoverageRatio,
      },
    });
  } else {
    // If baseline data IS sufficient, evaluate trend rules (saving, waste, neutral)
    const currentKwh = Number((totals.current_kwh || 0).toFixed(3));
    const baselineKwh = Number((totals.baseline_kwh || 0).toFixed(3));
    const deltaKwh = totals.delta_kwh !== null ? Number(Math.abs(totals.delta_kwh).toFixed(3)) : 0;
    const deltaPct = totals.delta_pct !== null ? Number(Math.abs(totals.delta_pct).toFixed(1)) : 0;

    if (totals.status === 'saving') {
      const params = {
        current_kwh: currentKwh,
        baseline_kwh: baselineKwh,
        delta_kwh: deltaKwh,
        delta_pct: deltaPct,
      };
      insights.push({
        rule_id: 'saving',
        severity: 'success',
        text_key: 'saving',
        title: texts.saving.title,
        message: texts.saving.message(params),
        recommendation: texts.saving.recommendation,
        params,
        evidence: {
          rule_id: 'saving',
          current_kwh: currentKwh,
          baseline_kwh: baselineKwh,
          delta_kwh: totals.delta_kwh,
          delta_pct: totals.delta_pct,
          threshold: `delta_pct >= +${neutralThresholdPct}%`,
        },
      });
    } else if (totals.status === 'waste') {
      const params = {
        current_kwh: currentKwh,
        baseline_kwh: baselineKwh,
        delta_kwh: deltaKwh,
        delta_pct: deltaPct,
      };
      insights.push({
        rule_id: 'waste',
        severity: 'warning',
        text_key: 'waste',
        title: texts.waste.title,
        message: texts.waste.message(params),
        recommendation: texts.waste.recommendation,
        params,
        evidence: {
          rule_id: 'waste',
          current_kwh: currentKwh,
          baseline_kwh: baselineKwh,
          delta_kwh: totals.delta_kwh,
          delta_pct: totals.delta_pct,
          threshold: `delta_pct <= -${neutralThresholdPct}%`,
        },
      });
    } else {
      // neutral
      const params = {
        current_kwh: currentKwh,
        baseline_kwh: baselineKwh,
        delta_kwh: deltaKwh,
        delta_pct: deltaPct,
        neutral_threshold_pct: neutralThresholdPct,
      };
      insights.push({
        rule_id: 'neutral',
        severity: 'neutral',
        text_key: 'neutral',
        title: texts.neutral.title,
        message: texts.neutral.message(params),
        recommendation: texts.neutral.recommendation,
        params,
        evidence: {
          rule_id: 'neutral',
          current_kwh: currentKwh,
          baseline_kwh: baselineKwh,
          delta_kwh: totals.delta_kwh,
          delta_pct: totals.delta_pct,
          threshold: `|delta_pct| < ${neutralThresholdPct}%`,
        },
      });
    }

    // Rule 5: top_room_deviation (only evaluated when baseline is available)
    const validRooms = byRoom.filter(
      (r) => r.delta_kwh !== null && Math.abs(r.delta_kwh) > 0.001
    );

    if (validRooms.length > 0) {
      let topRoom = validRooms[0];
      let totalAbsDelta = 0;

      for (const r of validRooms) {
        const absVal = Math.abs(r.delta_kwh);
        totalAbsDelta += absVal;
        if (absVal > Math.abs(topRoom.delta_kwh)) {
          topRoom = r;
        }
      }

      const sharePct =
        totalAbsDelta > 0
          ? Math.round((Math.abs(topRoom.delta_kwh) / totalAbsDelta) * 100)
          : 0;

      const params = {
        room_name: topRoom.room_name,
        room_id: topRoom.room_id,
        room_delta_kwh: Number(Math.abs(topRoom.delta_kwh).toFixed(3)),
        delta_direction: topRoom.delta_kwh >= 0 ? 'penghematan' : 'pemborosan',
        share_pct: sharePct,
      };

      insights.push({
        rule_id: 'top_room_deviation',
        severity: topRoom.delta_kwh < 0 ? 'warning' : 'info',
        text_key: 'top_room_deviation',
        title: texts.top_room_deviation.title,
        message: texts.top_room_deviation.message(params),
        recommendation: typeof texts.top_room_deviation.recommendation === 'function'
          ? texts.top_room_deviation.recommendation(params)
          : texts.top_room_deviation.recommendation,
        params,
        evidence: {
          rule_id: 'top_room_deviation',
          room_id: topRoom.room_id,
          room_name: topRoom.room_name,
          room_delta_kwh: topRoom.delta_kwh,
          total_abs_room_delta: Number(totalAbsDelta.toFixed(3)),
          share_pct: sharePct,
          threshold: 'ruangan dengan nilai mutlak deviasi selisih terbesar',
        },
      });
    }
  }

  // Rule 6: coverage_warning (unmonitored rooms or low coverage ratio)
  const unmonitored = byRoom.filter((r) => r.has_sensor === false);
  const isLowCoverage = coverage.ratio > 0 && coverage.ratio < lowCoverageThreshold;

  if (unmonitored.length > 0 || isLowCoverage) {
    const params = {
      unmonitored_count: unmonitored.length,
      total_rooms: byRoom.length,
      coverage_ratio: coverage.ratio,
      threshold: lowCoverageThreshold,
      low_coverage_rooms: unmonitored.map((r) => r.room_name).join(', ') || 'N/A',
    };

    insights.push({
      rule_id: 'coverage_warning',
      severity: 'warning',
      text_key: 'coverage_warning',
      title: texts.coverage_warning.title,
      message: texts.coverage_warning.message(params),
      recommendation: texts.coverage_warning.recommendation,
      params,
      evidence: {
        rule_id: 'coverage_warning',
        unmonitored_rooms: unmonitored.map((r) => ({ id: r.room_id, name: r.room_name })),
        unmonitored_count: unmonitored.length,
        total_rooms: byRoom.length,
        coverage_ratio: coverage.ratio,
        threshold: `coverage_ratio < ${lowCoverageThreshold} atau has_sensor === false`,
      },
    });
  }

  return insights;
}
