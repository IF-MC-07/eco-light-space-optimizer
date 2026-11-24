import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockSummaryResult = {
  series: [
    { bucket: '2026-11-20T00:00:00.000Z', actual_kwh: 5.2, baseline_kwh: 6.0 },
    { bucket: '2026-11-20T01:00:00.000Z', actual_kwh: 4.8, baseline_kwh: 5.5 },
  ],
  totals: {
    current_kwh: 10.0,
    baseline_kwh: 11.5,
    delta_kwh: 1.5,
    delta_pct: 13.04,
    status: 'saving',
    coverage: { days_with_data: 7, expected_days: 7, ratio: 1.0 },
    compared_buckets: 2,
    total_buckets: 2,
  },
  by_room: [
    {
      room_id: 'R01',
      room_name: 'Lab 1',
      actual_kwh: 6.0,
      baseline_kwh: 7.0,
      delta_kwh: 1.0,
      has_sensor: true,
    },
    {
      room_id: 'R02',
      room_name: 'Gudang',
      actual_kwh: null,
      baseline_kwh: null,
      delta_kwh: null,
      has_sensor: false,
    },
  ],
  meta: {
    baseline_weeks: 4,
    generated_at: '2026-11-20T02:00:00.000Z',
  },
};

const mockGetEnergySummary = jest.fn();

jest.unstable_mockModule('../../../app/services/energySummary.service.js', () => ({
  getEnergySummary: mockGetEnergySummary,
  getWIBStartOfDay: jest.fn((d) => new Date(d)),
  getWIBEndOfDay: jest.fn((d) => new Date(d)),
}));

const savingsController = await import('../../../app/controllers/savings.controller.js');
const energyController = await import('../../../app/controllers/energy.controller.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Energy Summary Controller Delegation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnergySummary.mockResolvedValue(mockSummaryResult);
  });

  describe('savingsController', () => {
    it('getTrend mendelegasikan ke getEnergySummary dan mengembalikan series dengan baseline_kwh', async () => {
      const req = { query: { range_type: 'daily' } };
      const res = createMockRes();
      const next = jest.fn();

      await savingsController.getTrend(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalled();
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data).toHaveLength(2);
      expect(payload.data[0].actual_kwh).toBe(5.2);
      expect(payload.data[0].baseline_kwh).toBe(6.0);
    });

    it('getYoY mendelegasikan ke getEnergySummary dan mengembalikan totals perbandingan', async () => {
      const req = { query: { range_type: 'weekly' } };
      const res = createMockRes();
      const next = jest.fn();

      await savingsController.getYoY(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.status).toBe('saving');
      expect(payload.data.current_kwh).toBe(10.0);
      expect(payload.data.baseline_kwh).toBe(11.5);
      expect(payload.data.delta_kwh).toBe(1.5);
      expect(payload.data.change_percentage).toBe(13.04);
      expect(payload.data.coverage.ratio).toBe(1.0);
      expect(payload.data.insights).toBeDefined();
      expect(Array.isArray(payload.data.insights)).toBe(true);
    });

    it('getExplanation mendelegasikan ke getEnergySummary dan mengembalikan insights', async () => {
      const req = { query: { range_type: 'weekly' } };
      const res = createMockRes();
      const next = jest.fn();

      await savingsController.getExplanation(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.insights).toBeDefined();
      expect(Array.isArray(payload.data.insights)).toBe(true);
      expect(payload.data.insights.length).toBeGreaterThan(0);
    });

    it('meneruskan include_simulated ke getEnergySummary dan menyertakan compared_buckets', async () => {
      const req = { query: { range_type: 'weekly', include_simulated: 'true' } };
      const res = createMockRes();
      const next = jest.fn();

      await savingsController.getSummary(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledWith(
        expect.objectContaining({
          includeSimulated: true,
        })
      );
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.compared_buckets).toBeDefined();
      expect(payload.data.total_buckets).toBeDefined();
    });

    it('getBreakdown mendelegasikan ke getEnergySummary dan mengembalikan by_room', async () => {
      const req = { query: { range_type: 'monthly' } };
      const res = createMockRes();
      const next = jest.fn();

      await savingsController.getBreakdown(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data).toHaveLength(2);
      expect(payload.data[0].has_sensor).toBe(true);
      expect(payload.data[0].actual_kwh).toBe(6.0);
      expect(payload.data[1].has_sensor).toBe(false);
      expect(payload.data[1].actual_kwh).toBeNull();
    });
  });

  describe('energyController', () => {
    it('getSummary mendelegasikan ke getEnergySummary untuk hari ini', async () => {
      const req = { query: {} };
      const res = createMockRes();
      const next = jest.fn();

      await energyController.getSummary(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.today_usage_kwh).toBe(10.0);
      expect(payload.data.today_baseline_kwh).toBe(11.5);
      expect(payload.data.today_delta_kwh).toBe(1.5);
      expect(payload.data.realtime_series).toBeDefined();
      expect(payload.data.by_room).toHaveLength(2);
    });

    it('getBreakdown mendelegasikan ke getEnergySummary dan mengembalikan by_room', async () => {
      const req = { query: { include_simulated: 'true' } };
      const res = createMockRes();
      const next = jest.fn();

      await energyController.getBreakdown(req, res, next);

      expect(mockGetEnergySummary).toHaveBeenCalledWith(
        expect.objectContaining({
          includeSimulated: true,
        })
      );
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data).toHaveLength(2);
      expect(payload.data[0].actual_kwh).toBe(6.0);
    });
  });
});
