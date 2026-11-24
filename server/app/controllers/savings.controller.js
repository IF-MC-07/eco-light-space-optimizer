import responseFormatter from '../utils/response.js';
import dayjs from 'dayjs';
import { getEnergySummary, getWIBStartOfDay, getWIBEndOfDay } from '../services/energySummary.service.js';
import { buildExplanation } from '../services/explanation.service.js';

/* ==================== resolveRanges ==================== */
export const resolveRanges = (range_type, start_date, end_date) => {
  const now = new Date();
  let from, to, granularity;

  switch (range_type) {
    case 'daily':
      from = getWIBStartOfDay(now);
      to = getWIBEndOfDay(now);
      granularity = 'hour';
      break;
    case 'weekly':
      // 7 hari kalender WIB utuh (6 hari lalu sampai hari ini)
      from = getWIBStartOfDay(new Date(now.getTime() - 6 * 24 * 3600 * 1000));
      to = getWIBEndOfDay(now);
      granularity = 'day';
      break;
    case 'yearly':
      from = getWIBStartOfDay(new Date(now.getTime() - 364 * 24 * 3600 * 1000));
      to = getWIBEndOfDay(now);
      granularity = 'day';
      break;
    case 'custom':
      if (start_date && end_date) {
        from = getWIBStartOfDay(start_date);
        to = getWIBEndOfDay(end_date);
        granularity = 'day';
      } else {
        from = getWIBStartOfDay(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
        to = getWIBEndOfDay(now);
        granularity = 'day';
      }
      break;
    case 'monthly':
    default:
      from = getWIBStartOfDay(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
      to = getWIBEndOfDay(now);
      granularity = 'day';
      break;
  }

  return { from, to, granularity };
};

/* ==================== GET SUMMARY ==================== */
export const getSummary = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id, include_simulated, include_partial } = req.query;
    const { from, to, granularity } = resolveRanges(range_type, start_date, end_date);

    const summary = await getEnergySummary({
      from,
      to,
      granularity,
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    return responseFormatter.success(
      res,
      {
        current_kwh: summary.totals.current_kwh,
        baseline_kwh: summary.totals.baseline_kwh,
        delta_kwh: summary.totals.delta_kwh,
        delta_pct: summary.totals.delta_pct,
        status: summary.totals.status,
        coverage: summary.totals.coverage,
        compared_buckets: summary.totals.compared_buckets,
        total_buckets: summary.totals.total_buckets,
        total_kwh: summary.totals.current_kwh,
        total_wh: summary.totals.current_kwh !== null
          ? Number((summary.totals.current_kwh * 1000).toFixed(2))
          : null,
      },
      'Success'
    );
  } catch (error) {
    next(error);
  }
};

/* ==================== GET BREAKDOWN ==================== */
export const getBreakdown = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id, include_simulated, include_partial } = req.query;
    const { from, to, granularity } = resolveRanges(range_type, start_date, end_date);

    const summary = await getEnergySummary({
      from,
      to,
      granularity,
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const formatted = summary.by_room.map((r) => {
      const actualKwh = r.actual_kwh;
      const baselineKwh = r.baseline_kwh;
      const deltaKwh = r.delta_kwh;

      let percentage = null;
      if (baselineKwh !== null && baselineKwh > 0 && deltaKwh !== null) {
        percentage = Number(((deltaKwh / baselineKwh) * 100).toFixed(1));
      }

      return {
        room_id: r.room_id,
        room_name: r.room_name,
        is_simulated: r.is_simulated ?? false,
        actual_kwh: actualKwh,
        baseline_kwh: baselineKwh,
        delta_kwh: deltaKwh,
        has_sensor: r.has_sensor,
        total_kwh: actualKwh,
        total_wh: actualKwh !== null ? Number((actualKwh * 1000).toFixed(2)) : null,
        percentage,
      };
    });

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET TREND ==================== */
export const getTrend = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id, include_simulated, include_partial } = req.query;
    const { from, to, granularity } = resolveRanges(range_type, start_date, end_date);

    const summary = await getEnergySummary({
      from,
      to,
      granularity,
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const isDaily = granularity === 'hour';
    const formatted = summary.series.map((s) => ({
      date: s.bucket,
      period: isDaily ? dayjs(s.bucket).format('HH:00') : dayjs(s.bucket).format('DD MMM'),
      actual_kwh: s.actual_kwh,
      baseline_kwh: s.baseline_kwh,
      partial: s.partial ?? false,
      actual: s.actual_kwh,
      baseline: s.baseline_kwh,
    }));

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET YOY ==================== */
export const getYoY = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id, include_simulated, include_partial } = req.query;
    const { from, to, granularity } = resolveRanges(range_type, start_date, end_date);

    const summary = await getEnergySummary({
      from,
      to,
      granularity,
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const insights = buildExplanation(summary);

    return responseFormatter.success(
      res,
      {
        status: summary.totals.status,
        current_kwh: summary.totals.current_kwh,
        baseline_kwh: summary.totals.baseline_kwh,
        delta_kwh: summary.totals.delta_kwh,
        change_percentage: summary.totals.delta_pct,
        coverage: summary.totals.coverage,
        compared_buckets: summary.totals.compared_buckets,
        total_buckets: summary.totals.total_buckets,
        meta: summary.meta,
        insights,
        current_period: {
          start: from,
          end: to,
          total_kwh: summary.totals.current_kwh,
          total_wh: summary.totals.current_kwh !== null
            ? Number((summary.totals.current_kwh * 1000).toFixed(2))
            : null,
        },
        previous_period: {
          total_kwh: summary.totals.baseline_kwh,
          total_wh: summary.totals.baseline_kwh !== null
            ? Number((summary.totals.baseline_kwh * 1000).toFixed(2))
            : null,
        },
      },
      'Success'
    );
  } catch (error) {
    next(error);
  }
};

/* ==================== GET EXPLANATION ==================== */
export const getExplanation = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id, include_simulated, include_partial } = req.query;
    const { from, to, granularity } = resolveRanges(range_type, start_date, end_date);

    const summary = await getEnergySummary({
      from,
      to,
      granularity,
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const insights = buildExplanation(summary);
    return responseFormatter.success(res, { insights }, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET POWER STATS ==================== */
export const getPowerStats = async (req, res, next) => {
  return responseFormatter.success(
    res,
    { message: 'Power stats didelegasikan ke getEnergySummary' },
    'Success'
  );
};
