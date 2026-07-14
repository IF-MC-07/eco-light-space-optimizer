import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import { buildEnergyRangeSeries, buildRealtimeHourlySeries } from '../utils/chartData.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    
    // Construct URLs
    const summaryUrl = room_id 
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/summary`;
    
    const realtimeUrl = room_id 
      ? `${AI_SERVICE_URL}/stats/realtime?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/stats/realtime`;

    // Fetch in parallel with fallback
    let summaryData;
    let realtimeData;
    try {
      const [summaryRes, realtimeRes] = await Promise.all([
        fetch(summaryUrl, { signal: AbortSignal.timeout(3000) }),
        fetch(realtimeUrl, { signal: AbortSignal.timeout(3000) })
      ]);
      if (!summaryRes.ok || !realtimeRes.ok) throw new Error('AI service returned non-OK response');
      summaryData = await summaryRes.json();
      realtimeData = await realtimeRes.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      const whereClause = room_id ? { room_id } : {};
      
      const recentSensors = await db.PowerSensor.findAll({
        where: whereClause,
        order: [['read_at', 'DESC']],
        limit: 24,
        raw: true
      });
      const currentConsumption = recentSensors.length > 0 
        ? recentSensors.reduce((sum, s) => sum + (s.power_watts || 0), 0) / recentSensors.length 
        : 0;

      const logs = await db.EnergyLog.findAll({
        where: whereClause,
        attributes: [
          [db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_consumption_watts'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'total_saved_watts']
        ],
        raw: true
      });
      const totalConsumption = logs[0]?.total_consumption_watts ? parseFloat(logs[0].total_consumption_watts) : 0;
      const totalSaved = logs[0]?.total_saved_watts ? parseFloat(logs[0].total_saved_watts) : 0;

      summaryData = {
        avg_daily_watts: totalConsumption / 30,
        total_consumption_watts: totalConsumption,
        total_saved_watts: totalSaved
      };
      realtimeData = {
        mean_watts: currentConsumption
      };
    }

    return responseFormatter.success(res, {
        current_consumption: realtimeData.mean_watts || 0.0,
        today_usage: summaryData.avg_daily_watts || 0.0,
        today_saved: (summaryData.total_saved_watts / 30) || 0.0,
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
      // AI service fallback — calculates from DB directly
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
      // AI service fallback — calculates from DB directly
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
          rank: index + 1 // arbitrary rank assignment
        };
      }).sort((a, b) => b.total_watts - a.total_watts); // sort by highest consumption
      
      // Update ranks after sorting
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

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};
