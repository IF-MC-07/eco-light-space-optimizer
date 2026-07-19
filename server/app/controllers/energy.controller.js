import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import { buildEnergyRangeSeries, buildRealtimeHourlySeries } from '../utils/chartData.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res, next) => {
  try {
    const { room_id } = req.query;

    const summaryUrl = room_id
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}`
      : `${AI_SERVICE_URL}/energy/summary`;

    const realtimeUrl = room_id
      ? `${AI_SERVICE_URL}/stats/realtime?room_id=${room_id}`
      : `${AI_SERVICE_URL}/stats/realtime`;

    let summaryData;
    let realtimeData;
    try {
      const [summaryRes, realtimeRes] = await Promise.all([
        fetch(summaryUrl, { signal: AbortSignal.timeout(5000) }),
        fetch(realtimeUrl, { signal: AbortSignal.timeout(5000) })
      ]);
      if (!summaryRes.ok || !realtimeRes.ok) throw new Error('AI service returned non-OK response');
      summaryData = await summaryRes.json();
      realtimeData = await realtimeRes.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      const whereClause = room_id ? { room_id } : {};

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentSensors = await db.PowerSensor.findAll({
        where: {
          ...whereClause,
          read_at: { [db.Sequelize.Op.gte]: twentyFourHoursAgo }
        },
        order: [['read_at', 'DESC']],
        limit: 5000,
        raw: true
      });

      const validPowerReadings = recentSensors.filter(s => (s.power_watts || 0) <= 5000);
      const currentConsumption = validPowerReadings.length > 0
        ? validPowerReadings.reduce((sum, s) => sum + (s.power_watts || 0), 0) / validPowerReadings.length
        : 0;
      const latestReadingWatts = recentSensors.length > 0 ? (recentSensors[0].power_watts || 0) : 0;

      const todayDateStr = new Date().toISOString().split('T')[0]; // "2026-07-20"
      const todayLogs = await db.EnergyLog.findAll({
        where: {
          ...whereClause,
          [db.Sequelize.Op.and]: db.Sequelize.where(
            db.Sequelize.fn('DATE', db.Sequelize.col('date')),
            db.Sequelize.fn('CURRENT_DATE')
          )
        },
        attributes: [
          [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'today_total_watts'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'today_saved_watts']
        ],
        raw: true
      });

      const todayTotalWatts = todayLogs[0]?.today_total_watts ? parseFloat(todayLogs[0].today_total_watts) : 0;
      const todaySavedWatts = todayLogs[0]?.today_saved_watts ? parseFloat(todayLogs[0].today_saved_watts) : 0;

      summaryData = {
        today_total_watts: todayTotalWatts,
        today_saved_watts: todaySavedWatts,
        total_consumption_watts: todayTotalWatts,
        total_saved_watts: todaySavedWatts
      };
      realtimeData = {
        mean_watts: currentConsumption,
        latest_reading: { power_watts: latestReadingWatts }
      };
    }

    return responseFormatter.success(res, {
      current_consumption: realtimeData.latest_reading?.power_watts ?? realtimeData.mean_watts ?? 0.0,
      today_usage: summaryData.today_total_watts ?? 0.0,
      today_saved: summaryData.today_saved_watts ?? 0.0,
      monthly_usage: summaryData.total_consumption_watts || 0.0,
      monthly_saved: summaryData.total_saved_watts || 0.0,
      chart_series: buildEnergyRangeSeries(
        (await db.EnergyLog.findAll({
          where: room_id ? { room_id } : {},
          attributes: ['date', 'total_watts', 'saved_watts'],
          order: [['date', 'ASC']],
          raw: true,
        })) || [],
        'month'
      ),
      realtime_series: buildRealtimeHourlySeries(
        (await db.PowerSensor.findAll({
          where: room_id ? { room_id } : {},
          attributes: ['read_at', 'power_watts'],
          order: [['read_at', 'ASC']],
          raw: true,
        })) || []
      )
    }, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { room_id, range } = req.query;
    const normalizedRange = ['day', 'week', 'month'].includes(range) ? range : 'month';

    const url = `${AI_SERVICE_URL}/energy/trend?days=30`;

    let trendData;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      trendData = await response.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const logs = await db.EnergyLog.findAll({
        where: {
          date: {
            [db.Sequelize.Op.gte]: startDate
          }
        },
        attributes: [
          'date',
          [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts']
        ],
        group: ['date'],
        order: [['date', 'ASC']],
        raw: true
      });

      trendData = logs.map(log => {
        const tw = parseFloat(log.total_watts || 0);
        const sw = parseFloat(log.saved_watts || 0);
        return {
          date: log.date,
          total_watts: tw,
          saved_watts: sw,
          savings_pct: tw > 0 ? (sw / tw) * 100 : 0
        };
      });
    }

    const directLogs = (await db.EnergyLog.findAll({
      where: room_id ? { room_id } : {},
      attributes: ['date', 'total_watts', 'saved_watts'],
      order: [['date', 'ASC']],
      raw: true,
    })) || [];

    const formattedTrend = buildEnergyRangeSeries(directLogs, normalizedRange);

    return responseFormatter.success(res, formattedTrend, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getBreakdown = async (req, res, next) => {
  try {
    const { room_id } = req.query;

    const url = room_id
      ? `${AI_SERVICE_URL}/energy/breakdown?room_id=${room_id}`
      : `${AI_SERVICE_URL}/energy/breakdown`;

    let breakdownData;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      breakdownData = await response.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      const whereClause = room_id ? { room_id } : {};
      const logs = await db.EnergyLog.findAll({
        where: whereClause,
        attributes: [
          'room_id',
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts']
        ],
        group: ['room_id', 'Room.room_id'],
        include: [{ model: db.Room, attributes: ['room_name'] }],
        raw: true,
        nest: true
      });

      breakdownData = logs.map((log, index) => {
        const sw = parseFloat(log.saved_watts || 0);
        const tw = parseFloat(log.total_watts || 0);
        return {
          room_id: log.room_id,
          room_name: log.Room ? log.Room.room_name : 'Unknown',
          total_watts: tw,
          saved_watts: sw,
          savings_pct: tw > 0 ? (sw / tw) * 100 : 0,
          rank: index + 1
        };
      }).sort((a, b) => b.total_watts - a.total_watts);

      breakdownData.forEach((item, index) => {
        item.rank = index + 1;
      });
    }

    const formatted = breakdownData.map(item => ({
      room_id: item.room_id,
      room_name: item.room_name,
      total_watts: item.total_watts,
      saved_watts: item.saved_watts,
      savings_pct: item.savings_pct,
      rank: item.rank
    }));

    return responseFormatter.success(res, formatted, 'Success');
  } catch (error) {
    next(error);
  }
};