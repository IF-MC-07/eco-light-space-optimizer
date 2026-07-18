import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import { buildEnergyRangeSeries } from '../utils/chartData.js';
import dayjs from 'dayjs';

const resolveRanges = async (range_type, start_date, end_date) => {
  // Find latest log date in DB to keep showcases working when no logs exist for today
  const latestLog = await db.EnergyLog.findOne({ order: [['date', 'DESC']] });
  const referenceDate = latestLog ? dayjs(latestLog.date) : dayjs();

  let currentStart, currentEnd, prevStart, prevEnd;

  switch (range_type) {
    case 'daily':
      currentStart = referenceDate.startOf('day');
      currentEnd = referenceDate.endOf('day');
      prevStart = currentStart.subtract(1, 'day');
      prevEnd = currentEnd.subtract(1, 'day');
      break;
    case 'weekly':
      currentEnd = referenceDate.endOf('day');
      currentStart = currentEnd.subtract(6, 'day').startOf('day');
      prevEnd = currentStart.subtract(1, 'second');
      prevStart = prevEnd.subtract(6, 'day').startOf('day');
      break;
    case 'yearly':
      currentEnd = referenceDate.endOf('day');
      currentStart = currentEnd.subtract(364, 'day').startOf('day');
      prevEnd = currentStart.subtract(1, 'second');
      prevStart = prevEnd.subtract(364, 'day').startOf('day');
      break;
    case 'custom':
      if (start_date && end_date) {
        currentStart = dayjs(start_date).startOf('day');
        currentEnd = dayjs(end_date).endOf('day');
        const durationDays = currentEnd.diff(currentStart, 'day') + 1;
        prevEnd = currentStart.subtract(1, 'second');
        prevStart = prevEnd.subtract(durationDays - 1, 'day').startOf('day');
      } else {
        // Fallback to monthly (30 days)
        currentEnd = referenceDate.endOf('day');
        currentStart = currentEnd.subtract(29, 'day').startOf('day');
        prevEnd = currentStart.subtract(1, 'second');
        prevStart = prevEnd.subtract(29, 'day').startOf('day');
      }
      break;
    case 'monthly':
    default:
      currentEnd = referenceDate.endOf('day');
      currentStart = currentEnd.subtract(29, 'day').startOf('day');
      prevEnd = currentStart.subtract(1, 'second');
      prevStart = prevEnd.subtract(29, 'day').startOf('day');
      break;
  }

  return {
    current: { start: currentStart.toDate(), end: currentEnd.toDate() },
    previous: { start: prevStart.toDate(), end: prevEnd.toDate() }
  };
};

export const getSummary = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);
    const whereClause = room_id ? { room_id } : {};

    const currentLogs = await db.EnergyLog.findOne({
      where: {
        ...whereClause,
        date: {
          [db.Sequelize.Op.between]: [ranges.current.start, ranges.current.end]
        }
      },
      attributes: [
        [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts']
      ],
      raw: true
    });

    const currentTotal = parseFloat(currentLogs?.total_watts || 0.0);
    const currentSaved = parseFloat(currentLogs?.saved_watts || 0.0);

    return responseFormatter.success(res, {
      total_watts: currentTotal,
      saved_watts: currentSaved,
      co2_saved_kg: currentSaved * 0.0005,
      cost_saved_idr: 0, 
    }, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getBreakdown = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);
    const whereClause = room_id ? { room_id } : {};

    const logs = await db.EnergyLog.findAll({
      where: {
        ...whereClause,
        date: {
          [db.Sequelize.Op.between]: [ranges.current.start, ranges.current.end]
        }
      },
      attributes: [
        'room_id',
        [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts']
      ],
      group: ['EnergyLog.room_id', 'Room.room_id'],
      include: [{ model: db.Room, attributes: ['room_name'] }],
      raw: true,
      nest: true
    });

    const formatted = logs.map(log => {
      const sw = parseFloat(log.saved_watts || 0);
      const tw = parseFloat(log.total_watts || 0);
      return {
        room_id: log.room_id,
        room_name: log.Room ? log.Room.room_name : 'Unknown',
        saved_watts: sw,
        total_watts: tw,
        percentage: tw > 0 ? parseFloat(((sw / tw) * 100).toFixed(1)) : 0
      };
    });

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getTrend = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);
    const whereClause = room_id ? { room_id } : {};

    if (range_type === 'daily') {
      const sensors = await db.PowerSensor.findAll({
        where: {
          ...whereClause,
          read_at: {
            [db.Sequelize.Op.between]: [ranges.current.start, ranges.current.end]
          }
        },
        attributes: ['read_at', 'power_watts'],
        order: [['read_at', 'ASC']],
        raw: true
      });

      const hourlyMap = {};
      sensors.forEach(s => {
        const hour = dayjs(s.read_at).format('HH:00');
        if (!hourlyMap[hour]) {
          hourlyMap[hour] = { total_watts: 0, count: 0 };
        }
        hourlyMap[hour].total_watts += parseFloat(s.power_watts || 0);
        hourlyMap[hour].count += 1;
      });

      const formatted = Object.keys(hourlyMap).sort().map(hour => ({
        label: hour,
        total_watts: parseFloat((hourlyMap[hour].total_watts / (hourlyMap[hour].count || 1)).toFixed(1)),
        saved_watts: 0
      }));

      return responseFormatter.success(res, formatted, 'Success');
    }

    const logs = await db.EnergyLog.findAll({
      where: {
        ...whereClause,
        date: {
          [db.Sequelize.Op.between]: [ranges.current.start, ranges.current.end]
        }
      },
      attributes: ['date', 'total_watts', 'saved_watts'],
      order: [['date', 'ASC']],
      raw: true
    });

    const formatted = logs.map(log => {
      let label = dayjs(log.date).format('MMM DD');
      if (range_type === 'yearly') {
        label = dayjs(log.date).format('MMM');
      }
      return {
        date: log.date,
        label: label,
        total_watts: parseFloat(log.total_watts || 0),
        saved_watts: parseFloat(log.saved_watts || 0)
      };
    });

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getYoY = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);
    const whereClause = room_id ? { room_id } : {};

    const currentLogs = await db.EnergyLog.findOne({
      where: {
        ...whereClause,
        date: {
          [db.Sequelize.Op.between]: [ranges.current.start, ranges.current.end]
        }
      },
      attributes: [
        [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts']
      ],
      raw: true
    });

    const prevLogs = await db.EnergyLog.findOne({
      where: {
        ...whereClause,
        date: {
          [db.Sequelize.Op.between]: [ranges.previous.start, ranges.previous.end]
        }
      },
      attributes: [
        [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts']
      ],
      raw: true
    });

    const currentTotal = parseFloat(currentLogs?.total_watts || 0.0);
    const prevTotal = parseFloat(prevLogs?.total_watts || 0.0);
    const currentSaved = parseFloat(currentLogs?.saved_watts || 0.0);
    const prevSaved = parseFloat(prevLogs?.saved_watts || 0.0);

    const diff = prevTotal - currentTotal; 
    let pct = 0;
    if (prevTotal > 0) {
      pct = (diff / prevTotal) * 100;
    }

    let status = 'neutral';
    if (diff > 0.01) {
      status = 'saving';
    } else if (diff < -0.01) {
      status = 'waste';
    }

    return responseFormatter.success(res, {
      current_period: {
        start: dayjs(ranges.current.start).format('YYYY-MM-DD'),
        end: dayjs(ranges.current.end).format('YYYY-MM-DD'),
        total_watts: currentTotal,
        saved_watts: currentSaved
      },
      previous_period: {
        start: dayjs(ranges.previous.start).format('YYYY-MM-DD'),
        end: dayjs(ranges.previous.end).format('YYYY-MM-DD'),
        total_watts: prevTotal,
        saved_watts: prevSaved
      },
      difference_watts: diff,
      change_percentage: parseFloat(pct.toFixed(1)),
      status: status
    }, 'Success');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /savings/power-stats
 * Returns statistics computed from power_sensors table:
 * - mean_watts, max_watts, min_watts, total_kwh (estimated)
 * - per-room breakdown
 * - efficiency_score (derived from how close avg is to min)
 */
export const getPowerStats = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    const whereClause = room_id ? { room_id } : {};

    // Get all sensor readings
    const sensors = await db.PowerSensor.findAll({
      where: whereClause,
      include: [{ model: db.Room, attributes: ['room_name'] }],
      order: [['read_at', 'DESC']],
      raw: true,
      nest: true,
    });

    if (sensors.length === 0) {
      return responseFormatter.success(res, {
        mean_watts: 0, min_watts: 0, max_watts: 0, std_watts: 0,
        total_kwh: 0, sample_count: 0,
        latest_read_at: null,
        efficiency_score: 88,
        room_breakdown: [],
      }, 'Success');
    }

    const watts = sensors.map(s => parseFloat(s.power_watts) || 0);
    const mean = watts.reduce((a, b) => a + b, 0) / watts.length;
    const min = Math.min(...watts);
    const max = Math.max(...watts);
    const variance = watts.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / watts.length;
    const std = Math.sqrt(variance);

    // Estimate total kWh: assuming each reading covers ~5 min interval
    const totalKwh = watts.reduce((a, b) => a + b, 0) * (5 / 60) / 1000;

    // Efficiency score: how close mean is to min (lower = more efficient = higher score)
    const range = max - min;
    const efficiencyScore = range > 0
      ? Math.max(0, Math.min(100, Math.round(100 - ((mean - min) / range) * 50)))
      : 88;

    // Per-room breakdown (latest reading per room)
    const roomMap = {};
    sensors.forEach(s => {
      if (!s.room_id) return;
      if (!roomMap[s.room_id]) {
        roomMap[s.room_id] = {
          room_id: s.room_id,
          room_name: s.Room?.room_name || s.room_id,
          readings: [],
        };
      }
      roomMap[s.room_id].readings.push(parseFloat(s.power_watts) || 0);
    });

    const room_breakdown = Object.values(roomMap).map(r => {
      const avg = r.readings.reduce((a, b) => a + b, 0) / r.readings.length;
      const totalKwhRoom = r.readings.reduce((a, b) => a + b, 0) * (5 / 60) / 1000;
      return {
        room_id: r.room_id,
        room_name: r.room_name,
        avg_watts: parseFloat(avg.toFixed(2)),
        total_kwh: parseFloat(totalKwhRoom.toFixed(3)),
        reading_count: r.readings.length,
      };
    }).sort((a, b) => b.avg_watts - a.avg_watts);

    return responseFormatter.success(res, {
      mean_watts: parseFloat(mean.toFixed(2)),
      min_watts: parseFloat(min.toFixed(2)),
      max_watts: parseFloat(max.toFixed(2)),
      std_watts: parseFloat(std.toFixed(2)),
      total_kwh: parseFloat(totalKwh.toFixed(3)),
      sample_count: sensors.length,
      latest_read_at: sensors[0]?.read_at || null,
      efficiency_score: efficiencyScore,
      room_breakdown,
    }, 'Success');
  } catch (error) {
    next(error);
  }
};
