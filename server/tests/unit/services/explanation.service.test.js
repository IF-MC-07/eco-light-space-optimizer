import { describe, it, expect } from '@jest/globals';
import { buildExplanation, texts } from '../../../app/services/explanation.service.js';

describe('Explanation Service - Rule-Based Explanation (TAHAP 6)', () => {
  describe('Rule: insufficient_data', () => {
    it('triggers when status is insufficient_baseline', () => {
      const summary = {
        totals: {
          current_kwh: 12.5,
          baseline_kwh: null,
          delta_kwh: null,
          delta_pct: null,
          status: 'insufficient_baseline',
          coverage: { days_with_data: 2, expected_days: 7, ratio: 0.28 },
        },
        by_room: [],
      };

      const insights = buildExplanation(summary);

      const insufficientInsight = insights.find((i) => i.rule_id === 'insufficient_data');
      expect(insufficientInsight).toBeDefined();
      expect(insufficientInsight.severity).toBe('info');
      expect(insufficientInsight.evidence.status).toBe('insufficient_baseline');
      expect(insufficientInsight.evidence.coverage_ratio).toBe(0.28);
      expect(insufficientInsight.recommendation).toContain('Lanjutkan pengumpulan data');

      // CRITICAL requirement: Kasus data tidak cukup tidak boleh menghasilkan klaim tren
      const trendClaim = insights.find((i) =>
        ['saving', 'waste', 'neutral'].includes(i.rule_id)
      );
      expect(trendClaim).toBeUndefined();
    });

    it('triggers when coverage ratio is below minCoverageRatio threshold', () => {
      const summary = {
        totals: {
          current_kwh: 50,
          baseline_kwh: 60,
          delta_kwh: 10,
          delta_pct: 16.7,
          status: 'saving',
          coverage: { days_with_data: 2, expected_days: 7, ratio: 0.28 },
        },
        by_room: [],
      };

      // Even though status says saving, coverage ratio is 0.28 < 0.5 default
      const insights = buildExplanation(summary, { minCoverageRatio: 0.5 });
      const insufficientInsight = insights.find((i) => i.rule_id === 'insufficient_data');
      expect(insufficientInsight).toBeDefined();

      // No trend claim allowed when coverage is below threshold
      const trendClaim = insights.find((i) =>
        ['saving', 'waste', 'neutral'].includes(i.rule_id)
      );
      expect(trendClaim).toBeUndefined();
    });
  });

  describe('Rule: saving', () => {
    it('triggers when status is saving and coverage is sufficient', () => {
      const summary = {
        totals: {
          current_kwh: 80.0,
          baseline_kwh: 100.0,
          delta_kwh: 20.0,
          delta_pct: 20.0,
          status: 'saving',
          coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
        },
        by_room: [],
      };

      const insights = buildExplanation(summary);
      const savingInsight = insights.find((i) => i.rule_id === 'saving');

      expect(savingInsight).toBeDefined();
      expect(savingInsight.severity).toBe('success');
      expect(savingInsight.params.delta_kwh).toBe(20.0);
      expect(savingInsight.params.delta_pct).toBe(20.0);
      expect(savingInsight.evidence.current_kwh).toBe(80.0);
      expect(savingInsight.evidence.baseline_kwh).toBe(100.0);
      expect(savingInsight.recommendation).toContain('Pertahankan aturan otomasi');
    });
  });

  describe('Rule: waste', () => {
    it('triggers when status is waste and consumption exceeds baseline', () => {
      const summary = {
        totals: {
          current_kwh: 125.0,
          baseline_kwh: 100.0,
          delta_kwh: -25.0,
          delta_pct: -25.0,
          status: 'waste',
          coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
        },
        by_room: [],
      };

      const insights = buildExplanation(summary);
      const wasteInsight = insights.find((i) => i.rule_id === 'waste');

      expect(wasteInsight).toBeDefined();
      expect(wasteInsight.severity).toBe('warning');
      expect(wasteInsight.params.delta_kwh).toBe(25.0);
      expect(wasteInsight.params.delta_pct).toBe(25.0);
      expect(wasteInsight.evidence.delta_kwh).toBe(-25.0);
      expect(wasteInsight.recommendation).toContain('Tinjau kembali jadwal otomasi');
    });
  });

  describe('Rule: neutral', () => {
    it('triggers when consumption is within neutral tolerance', () => {
      const summary = {
        totals: {
          current_kwh: 102.0,
          baseline_kwh: 100.0,
          delta_kwh: -2.0,
          delta_pct: -2.0,
          status: 'neutral',
          coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
        },
        by_room: [],
      };

      const insights = buildExplanation(summary);
      const neutralInsight = insights.find((i) => i.rule_id === 'neutral');

      expect(neutralInsight).toBeDefined();
      expect(neutralInsight.severity).toBe('neutral');
      expect(neutralInsight.params.delta_pct).toBe(2.0);
      expect(neutralInsight.recommendation).toContain('Terapkan batas peredupan');
    });
  });

  describe('Rule: top_room_deviation', () => {
    it('identifies the room with highest absolute deviation and its share', () => {
      const summary = {
        totals: {
          current_kwh: 170.0,
          baseline_kwh: 200.0,
          delta_kwh: 30.0,
          delta_pct: 15.0,
          status: 'saving',
          coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
        },
        by_room: [
          { room_id: 'R1', room_name: 'Lab AI', delta_kwh: 24.0, has_sensor: true },
          { room_id: 'R2', room_name: 'Ruang Dosen', delta_kwh: 6.0, has_sensor: true },
          { room_id: 'R3', room_name: 'Kelas 101', delta_kwh: 0.0, has_sensor: true },
        ],
      };

      const insights = buildExplanation(summary);
      const topRoomInsight = insights.find((i) => i.rule_id === 'top_room_deviation');

      expect(topRoomInsight).toBeDefined();
      expect(topRoomInsight.params.room_name).toBe('Lab AI');
      expect(topRoomInsight.params.room_id).toBe('R1');
      expect(topRoomInsight.params.room_delta_kwh).toBe(24.0);
      // Total abs delta = 24 + 6 = 30. Share = 24/30 = 80%
      expect(topRoomInsight.params.share_pct).toBe(80);
      expect(topRoomInsight.evidence.share_pct).toBe(80);
      expect(topRoomInsight.recommendation).toContain('Lab AI');
    });

    it('does not trigger top_room_deviation when baseline is insufficient', () => {
      const summary = {
        totals: {
          current_kwh: 10.0,
          baseline_kwh: null,
          delta_kwh: null,
          delta_pct: null,
          status: 'insufficient_baseline',
          coverage: { days_with_data: 1, expected_days: 7, ratio: 0.14 },
        },
        by_room: [
          { room_id: 'R1', room_name: 'Lab AI', delta_kwh: null, has_sensor: true },
        ],
      };

      const insights = buildExplanation(summary);
      const topRoomInsight = insights.find((i) => i.rule_id === 'top_room_deviation');
      expect(topRoomInsight).toBeUndefined();
    });
  });

  describe('Rule: coverage_warning', () => {
    it('triggers when there are rooms without sensors', () => {
      const summary = {
        totals: {
          current_kwh: 100.0,
          baseline_kwh: 100.0,
          delta_kwh: 0,
          delta_pct: 0,
          status: 'neutral',
          coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
        },
        by_room: [
          { room_id: 'R1', room_name: 'Lab AI', delta_kwh: 0, has_sensor: true },
          { room_id: 'R2', room_name: 'Gudang Alat', delta_kwh: null, has_sensor: false },
        ],
      };

      const insights = buildExplanation(summary);
      const coverageInsight = insights.find((i) => i.rule_id === 'coverage_warning');

      expect(coverageInsight).toBeDefined();
      expect(coverageInsight.severity).toBe('warning');
      expect(coverageInsight.params.unmonitored_count).toBe(1);
      expect(coverageInsight.params.low_coverage_rooms).toContain('Gudang Alat');
      expect(coverageInsight.evidence.unmonitored_count).toBe(1);
    });

    it('triggers when overall coverage ratio is low (< 0.8)', () => {
      const summary = {
        totals: {
          current_kwh: 90.0,
          baseline_kwh: 100.0,
          delta_kwh: 10.0,
          delta_pct: 10.0,
          status: 'saving',
          coverage: { days_with_data: 5, expected_days: 7, ratio: 0.71 },
        },
        by_room: [
          { room_id: 'R1', room_name: 'Lab AI', delta_kwh: 10.0, has_sensor: true },
        ],
      };

      const insights = buildExplanation(summary, { lowCoverageThreshold: 0.8 });
      const coverageInsight = insights.find((i) => i.rule_id === 'coverage_warning');

      expect(coverageInsight).toBeDefined();
      expect(coverageInsight.evidence.coverage_ratio).toBe(0.71);
    });
  });

  describe('Edge cases and purity', () => {
    it('returns empty array on invalid or empty summary input', () => {
      expect(buildExplanation(null)).toEqual([]);
      expect(buildExplanation({})).toEqual([]);
      expect(buildExplanation({ totals: null })).toEqual([]);
    });

    it('texts map contains definitions for all 6 initial rules', () => {
      const requiredRules = [
        'insufficient_data',
        'saving',
        'waste',
        'neutral',
        'top_room_deviation',
        'coverage_warning',
      ];
      for (const rule of requiredRules) {
        expect(texts[rule]).toBeDefined();
        expect(texts[rule].title).toBeDefined();
        expect(texts[rule].message).toBeDefined();
        expect(texts[rule].recommendation).toBeDefined();
      }
    });
  });
});
