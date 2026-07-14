import { describe, expect, it } from '@jest/globals';
import { buildEnergyRangeSeries } from '../../../app/utils/chartData.js';

describe('buildEnergyRangeSeries', () => {
  it('groups logs into a chart-friendly series for weekly view', () => {
    const today = new Date();
    const first = new Date(today);
    first.setDate(today.getDate() - 2);

    const second = new Date(today);
    second.setDate(today.getDate() - 1);

    const third = new Date(today);

    const rows = [
      { date: first.toISOString(), total_watts: 1000, saved_watts: 200 },
      { date: second.toISOString(), total_watts: 1200, saved_watts: 150 },
      { date: third.toISOString(), total_watts: 800, saved_watts: 300 },
    ];

    const series = buildEnergyRangeSeries(rows, 'week');

    expect(series).toHaveLength(7);
    expect(series.some((item) => item.usage === 1000 && item.savings === 200)).toBe(true);
    expect(series.some((item) => item.usage === 1200 && item.savings === 150)).toBe(true);
    expect(series.some((item) => item.usage === 800 && item.savings === 300)).toBe(true);
  });
});
