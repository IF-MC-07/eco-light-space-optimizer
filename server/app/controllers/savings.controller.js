import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import dayjs from 'dayjs';
import { computeEnergyByRoom, computeEnergyTrend } from '../utils/energyAggregation.util.js';

/* ==================== resolveRanges ==================== */
const resolveRanges = async (range_type, start_date, end_date) => {
  const latestReading = await db.PowerSensor.findOne({ order: [['read_at', 'DESC']] });
  const referenceDate = latestReading ? dayjs(latestReading.read_at) : dayjs();

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
    previous: { start: prevStart.toDate(), end: prevEnd.toDate() },
  };
};

/* ==================== GET SUMMARY ==================== */
export const getSummary = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);

    const currentRows = await computeEnergyByRoom(db.sequelize, ranges.current.start, ranges.current.end, room_id || null);
    const currentTotalKwh = currentRows.reduce((sum, r) => sum + (r.total_kwh || 0), 0);

    return responseFormatter.success(res, {
      total_wh: parseFloat((currentTotalKwh * 1000).toFixed(2)),
      total_kwh: parseFloat(currentTotalKwh.toFixed(4)),
      saved_watts: null,
      has_savings_data: false,
      co2_saved_kg: 0,
      cost_saved_idr: 0,
    }, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET BREAKDOWN ==================== */
export const getBreakdown = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);

    const [energyRows, rooms] = await Promise.all([
      computeEnergyByRoom(db.sequelize, ranges.current.start, ranges.current.end, room_id || null),
      db.Room.findAll({ attributes: ['room_id', 'room_name'], raw: true }),
    ]);

    const roomNameMap = Object.fromEntries(rooms.map(r => [r.room_id, r.room_name]));

    const formatted = energyRows.map(r => {
      const totalWh = r.total_wh || 0;
      const totalKwh = r.total_kwh || 0;

      let totalEnergyDisplay = '0 Wh';
      if (totalWh > 0) {
        totalEnergyDisplay = totalWh >= 1000 
          ? `${totalKwh.toFixed(3)} kWh` 
          : `${totalWh.toFixed(1)} Wh`;
      }

      return {
        room_id: r.room_id,
        room_name: roomNameMap[r.room_id] || 'Unknown',
        total_kwh: totalKwh,
        total_wh: totalWh,
        total_energy: totalEnergyDisplay,
        saved_watts: null,
        saved_kwh: null,
        has_savings_data: false,        // ← diperbaiki (plural)
        percentage: null,
        note: "Fitur penghematan otomatis belum aktif"
      };
    }).sort((a, b) => b.total_wh - a.total_wh);

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET TREND ==================== */
export const getTrend = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);

    const granularity = range_type === 'daily' ? 'hour' : 'day';
    const rows = await computeEnergyTrend(db.sequelize, ranges.current.start, ranges.current.end, granularity, room_id || null);

    const formatted = rows.map(r => {
      const bucketDate = dayjs(r.bucket);
      const isDaily = range_type === 'daily';

      let label = isDaily ? bucketDate.format('HH:00') : bucketDate.format('MMM DD');

      return {
        date: r.bucket,
        label,
        value: isDaily ? r.total_wh : r.total_kwh,
        unit: isDaily ? 'Wh' : 'kWh',
        total_kwh: r.total_kwh,
        total_wh: r.total_wh,
        saved_watts: 0,
      };
    });

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};

/* ==================== GET YOY (Period Comparison) ==================== */
export const getYoY = async (req, res, next) => {
  try {
    const { range_type, start_date, end_date, room_id } = req.query;
    const ranges = await resolveRanges(range_type, start_date, end_date);

    const [currentRows, previousRows] = await Promise.all([
      computeEnergyByRoom(db.sequelize, ranges.current.start, ranges.current.end, room_id || null),
      computeEnergyByRoom(db.sequelize, ranges.previous.start, ranges.previous.end, room_id || null),
    ]);

    const currentTotalKwh = currentRows.reduce((s, r) => s + (r.total_kwh || 0), 0);
    const prevTotalKwh = previousRows.reduce((s, r) => s + (r.total_kwh || 0), 0);

    const currentTotalWh = currentTotalKwh * 1000;
    const prevTotalWh = prevTotalKwh * 1000;

    const MIN_MEANINGFUL_BASELINE_WH = 0.5;
    const NEUTRAL_THRESHOLD_WH = 1.0;

    let status = 'insufficient_baseline';
    let changePercentage = null;
    let diffWh = null;
    let displayPercentage = null;

    if (prevTotalWh >= MIN_MEANINGFUL_BASELINE_WH) {
      diffWh = prevTotalWh - currentTotalWh;
      const rawPct = (diffWh / prevTotalWh) * 100;

      displayPercentage = Math.abs(rawPct) > 500 
        ? (rawPct > 0 ? 500 : -500) 
        : parseFloat(rawPct.toFixed(1));

      if (Math.abs(diffWh) <= NEUTRAL_THRESHOLD_WH) {
        status = 'neutral';
        displayPercentage = 0;
      } else if (diffWh > 0) {
        status = 'saving';
      } else {
        status = 'waste';
      }
    }

    return responseFormatter.success(res, {
      current_period: {
        start: ranges.current.start,
        end: ranges.current.end,
        total_kwh: parseFloat(currentTotalKwh.toFixed(4)),
        total_wh: parseFloat(currentTotalWh.toFixed(2)),
      },
      previous_period: {
        start: ranges.previous.start,
        end: ranges.previous.end,
        total_kwh: parseFloat(prevTotalKwh.toFixed(4)),
        total_wh: parseFloat(prevTotalWh.toFixed(2)),
      },
      difference_wh: diffWh !== null ? parseFloat(diffWh.toFixed(2)) : null,
      change_percentage: displayPercentage,
      status,
      debug_info: {
        prev_kwh: parseFloat(prevTotalKwh.toFixed(4)),
        current_kwh: parseFloat(currentTotalKwh.toFixed(4)),
        prev_wh: parseFloat(prevTotalWh.toFixed(2)),
        raw_change_pct: prevTotalWh > 0 ? parseFloat(((prevTotalWh - currentTotalWh) / prevTotalWh * 100).toFixed(1)) : null
      }
    }, 'Success');
  } catch (error) {
    console.error('Error in getYoY:', error);
    next(error);
  }
};

/* ==================== GET POWER STATS ==================== */
export const getPowerStats = async (req, res, next) => {
  // TODO: Isi dengan kode lama jika diperlukan
  return responseFormatter.success(res, { message: "Power stats belum diimplementasikan" }, 'Success');
};