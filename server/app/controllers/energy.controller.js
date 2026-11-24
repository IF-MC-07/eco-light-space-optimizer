import responseFormatter from '../utils/response.js';
import dayjs from 'dayjs';
import { getEnergySummary, getWIBStartOfDay, getWIBEndOfDay } from '../services/energySummary.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const { room_id, include_simulated, include_partial } = req.query;
    const now = new Date();
    const from = getWIBStartOfDay(now);
    const to = getWIBEndOfDay(now);

    const summary = await getEnergySummary({
      from,
      to,
      granularity: 'hour',
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const realtime_series = summary.series.map((s) => ({
      time: dayjs(s.bucket).format('HH:mm'),
      bucket: s.bucket,
      actual_kwh: s.actual_kwh,
      baseline_kwh: s.baseline_kwh,
      actual: s.actual_kwh,
      baseline: s.baseline_kwh,
      partial: s.partial ?? false,
    }));

    return responseFormatter.success(
      res,
      {
        today_usage_kwh: summary.totals.current_kwh,
        today_baseline_kwh: summary.totals.baseline_kwh,
        today_delta_kwh: summary.totals.delta_kwh,
        status: summary.totals.status,
        coverage: summary.totals.coverage,
        compared_buckets: summary.totals.compared_buckets,
        total_buckets: summary.totals.total_buckets,
        realtime_series,
        by_room: summary.by_room,
        // Properti kompatibilitas mundur
        today_usage: summary.totals.current_kwh !== null
          ? Number((summary.totals.current_kwh * 1000).toFixed(2))
          : 0,
        today_saved: summary.totals.delta_kwh !== null
          ? Number((summary.totals.delta_kwh * 1000).toFixed(2))
          : 0,
      },
      'Success'
    );
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { room_id, range, include_simulated, include_partial } = req.query;
    const normalizedRange = ['day', 'week', 'month'].includes(range) ? range : 'month';
    const now = new Date();
    let from, granularity;

    if (normalizedRange === 'day') {
      from = getWIBStartOfDay(now);
      granularity = 'hour';
    } else if (normalizedRange === 'week') {
      from = getWIBStartOfDay(new Date(now.getTime() - 6 * 24 * 3600 * 1000));
      granularity = 'day';
    } else {
      from = getWIBStartOfDay(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
      granularity = 'day';
    }
    const to = getWIBEndOfDay(now);

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
      label: isDaily ? dayjs(s.bucket).format('HH:00') : dayjs(s.bucket).format('MMM DD'),
      actual_kwh: s.actual_kwh,
      baseline_kwh: s.baseline_kwh,
      usage: s.actual_kwh,
      value: s.actual_kwh,
      partial: s.partial ?? false,
    }));

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getBreakdown = async (req, res, next) => {
  try {
    const { room_id, include_simulated, include_partial } = req.query;
    const now = new Date();
    const from = getWIBStartOfDay(now);
    const to = getWIBEndOfDay(now);

    const summary = await getEnergySummary({
      from,
      to,
      granularity: 'hour',
      roomId: room_id || null,
      includeSimulated: include_simulated === 'true',
      includePartial: include_partial === 'true',
    });

    const formatted = summary.by_room.map((r) => ({
      room_id: r.room_id,
      room_name: r.room_name,
      is_simulated: r.is_simulated ?? false,
      actual_kwh: r.actual_kwh,
      baseline_kwh: r.baseline_kwh,
      delta_kwh: r.delta_kwh,
      has_sensor: r.has_sensor,
      total_watts: r.actual_kwh !== null ? Number((r.actual_kwh * 1000).toFixed(2)) : 0,
      saved_watts: r.delta_kwh !== null ? Number((r.delta_kwh * 1000).toFixed(2)) : 0,
    }));

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};
