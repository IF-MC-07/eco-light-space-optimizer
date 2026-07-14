import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

 dayjs.extend(utc);
 dayjs.extend(timezone);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatLabel = (date, range) => {
  if (!date) return 'N/A';

  switch (range) {
    case 'day':
      return dayjs(date).format('HH:mm');
    case 'week':
      return dayjs(date).format('ddd');
    case 'month':
      return dayjs(date).format('MMM D');
    default:
      return dayjs(date).format('MMM D');
  }
};

export const buildEnergyRangeSeries = (rows = [], range = 'month') => {
  const normalizedRows = (rows || [])
    .map((row) => {
      const date = normalizeDate(row.date ?? row.read_at ?? row.timestamp);
      if (!date) return null;

      return {
        date,
        total_watts: toNumber(row.total_watts ?? row.power_watts ?? row.usage_watts ?? row.value),
        saved_watts: toNumber(row.saved_watts ?? row.saved ?? 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (normalizedRows.length === 0) {
    return [];
  }

  if (range === 'day') {
    const now = dayjs();
    const start = now.subtract(23, 'hour').startOf('hour').toDate();
    const buckets = [];
    for (let i = 23; i >= 0; i -= 1) {
      const hourDate = dayjs(now).subtract(i, 'hour').startOf('hour').toDate();
      buckets.push({
        label: formatLabel(hourDate, 'day'),
        date: hourDate,
        usage: 0,
        savings: 0,
      });
    }

    normalizedRows.forEach((row) => {
      const hourKey = dayjs(row.date).startOf('hour').valueOf();
      const bucket = buckets.find((item) => dayjs(item.date).startOf('hour').valueOf() === hourKey);
      if (bucket) {
        bucket.usage += row.total_watts;
        bucket.savings += row.saved_watts;
      }
    });

    return buckets
      .filter((item) => item.date >= start)
      .map((item) => ({
        label: item.label,
        usage: Number(item.usage.toFixed(1)),
        savings: Number(item.savings.toFixed(1)),
        efficiency: item.usage > 0 ? Number(((item.savings / item.usage) * 100).toFixed(1)) : 0,
      }));
  }

  if (range === 'week') {
    const buckets = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayDate = dayjs().subtract(i, 'day').startOf('day').toDate();
      buckets.push({
        label: formatLabel(dayDate, 'week'),
        date: dayDate,
        usage: 0,
        savings: 0,
      });
    }

    normalizedRows.forEach((row) => {
      const dayKey = dayjs(row.date).startOf('day').format('YYYY-MM-DD');
      const bucket = buckets.find((item) => dayjs(item.date).startOf('day').format('YYYY-MM-DD') === dayKey);
      if (bucket) {
        bucket.usage += row.total_watts;
        bucket.savings += row.saved_watts;
      }
    });

    return buckets.map((item) => ({
      label: item.label,
      usage: Number(item.usage.toFixed(1)),
      savings: Number(item.savings.toFixed(1)),
      efficiency: item.usage > 0 ? Number(((item.savings / item.usage) * 100).toFixed(1)) : 0,
    }));
  }

  const buckets = [];
  const monthLookback = 30;
  for (let i = monthLookback - 1; i >= 0; i -= 1) {
    const dayDate = dayjs().subtract(i, 'day').startOf('day').toDate();
    buckets.push({
      label: formatLabel(dayDate, 'month'),
      date: dayDate,
      usage: 0,
      savings: 0,
    });
  }

  normalizedRows.forEach((row) => {
    const dayKey = dayjs(row.date).startOf('day').format('YYYY-MM-DD');
    const bucket = buckets.find((item) => dayjs(item.date).startOf('day').format('YYYY-MM-DD') === dayKey);
    if (bucket) {
      bucket.usage += row.total_watts;
      bucket.savings += row.saved_watts;
    }
  });

  return buckets.map((item) => ({
    label: item.label,
    usage: Number(item.usage.toFixed(1)),
    savings: Number(item.savings.toFixed(1)),
    efficiency: item.usage > 0 ? Number(((item.savings / item.usage) * 100).toFixed(1)) : 0,
  }));
};

export const buildRealtimeHourlySeries = (rows = []) => {
  const normalizedRows = (rows || [])
    .map((row) => ({
      date: normalizeDate(row.read_at ?? row.date ?? row.timestamp),
      usage: toNumber(row.power_watts ?? row.total_watts ?? row.value ?? 0),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date - b.date);

  if (normalizedRows.length === 0) {
    return [];
  }

  const start = dayjs().subtract(23, 'hour').startOf('hour').toDate();
  const buckets = [];
  for (let i = 23; i >= 0; i -= 1) {
    const hourDate = dayjs().subtract(i, 'hour').startOf('hour').toDate();
    buckets.push({
      time: dayjs(hourDate).format('HH:mm'),
      date: hourDate,
      actual: 0,
      baseline: 0,
    });
  }

  normalizedRows.forEach((row) => {
    if (row.date < start) return;
    const hourKey = dayjs(row.date).startOf('hour').valueOf();
    const bucket = buckets.find((item) => dayjs(item.date).startOf('hour').valueOf() === hourKey);
    if (bucket) {
      bucket.actual += row.usage;
    }
  });

  return buckets.map((item) => ({
    time: item.time,
    actual: Number((item.actual / 1000).toFixed(2)),
    baseline: Number(((item.actual || 0) * 0.9 / 1000).toFixed(2)),
  }));
};
