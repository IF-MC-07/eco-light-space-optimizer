import responseFormatter from '../utils/response.js';
import db from '../models/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    
    const url = room_id 
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/summary`;
      
    let summary;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      summary = await response.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      // AI service fallback — calculates from DB directly
      const whereClause = room_id ? { room_id } : {};
      const logs = await db.EnergyLog.findAll({
        where: whereClause,
        attributes: [
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'total_saved_watts']
        ],
        raw: true
      });
      const total_saved = logs[0]?.total_saved_watts ? parseFloat(logs[0].total_saved_watts) : 0.0;
      summary = {
        total_saved_watts: total_saved,
        co2_kg_saved: total_saved * 0.0005,
        cost_idr_saved: total_saved * 1.5
      };
    }

    return responseFormatter.success(res, {
        total_saved_watts: summary.total_saved_watts || 0.0,
        today_saved_watts: (summary.total_saved_watts / 30) || 0.0, // daily average estimate
        co2_saved_kg: summary.co2_kg_saved || 0.0,
        cost_saved_idr: summary.cost_idr_saved || 0.0
      }, 'Success');
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
      
    let breakdown;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      breakdown = await response.json();
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
      breakdown = logs.map(log => {
        const sw = parseFloat(log.saved_watts || 0);
        const tw = parseFloat(log.total_watts || 0);
        return {
          room_id: log.room_id,
          room_name: log.Room ? log.Room.room_name : 'Unknown',
          saved_watts: sw,
          total_watts: tw,
          savings_pct: tw > 0 ? (sw / tw) * 100 : 0
        };
      });
    }

    const formatted = breakdown.map(item => ({
      room_id: item.room_id,
      room_name: item.room_name,
      saved_watts: item.saved_watts,
      total_watts: item.total_watts,
      percentage: item.savings_pct
    }));

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};

export const getTrend = async (req, res, next) => {
  try {
    const { days } = req.query;
    const numDays = days ? parseInt(days) : 7;
    
    const url = `${AI_SERVICE_URL}/energy/trend?days=${numDays}`;
    
    let trend;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      trend = await response.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      // AI service fallback — calculates from DB directly
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);
      
      const logs = await db.EnergyLog.findAll({
        where: {
          date: {
            [db.Sequelize.Op.gte]: startDate
          }
        },
        attributes: [
          'date',
          [db.Sequelize.fn('SUM', db.Sequelize.col('saved_watts')), 'saved_watts']
        ],
        group: ['date'],
        order: [['date', 'ASC']],
        raw: true
      });
      trend = logs.map(log => ({
        date: log.date,
        saved_watts: parseFloat(log.saved_watts || 0)
      }));
    }

    const formatted = trend.map(item => ({
      date: item.date,
      saved_watts: item.saved_watts
    }));

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};

export const getYoY = async (req, res, next) => {
  try {
    const url = `${AI_SERVICE_URL}/energy/yoy`;
    
    let yoy;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('AI service returned non-OK response');
      yoy = await response.json();
    } catch (err) {
      console.warn('[fallback] AI service unavailable, using DB data');
      // AI service fallback — calculates from DB directly
      const currentYear = new Date().getFullYear();
      
      const thisYearLogs = await db.EnergyLog.findAll({
        where: {
          date: {
            [db.Sequelize.Op.gte]: new Date(`${currentYear}-01-01`),
            [db.Sequelize.Op.lt]: new Date(`${currentYear + 1}-01-01`)
          }
        },
        attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts']],
        raw: true
      });
      
      const lastYearLogs = await db.EnergyLog.findAll({
        where: {
          date: {
            [db.Sequelize.Op.gte]: new Date(`${currentYear - 1}-01-01`),
            [db.Sequelize.Op.lt]: new Date(`${currentYear}-01-01`)
          }
        },
        attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('total_watts')), 'total_watts']],
        raw: true
      });
      
      const thisYearWatts = thisYearLogs[0]?.total_watts ? parseFloat(thisYearLogs[0].total_watts) : 0.0;
      const lastYearWatts = lastYearLogs[0]?.total_watts ? parseFloat(lastYearLogs[0].total_watts) : 0.0;
      
      let yoy_change_pct = 0;
      if (lastYearWatts > 0) {
        yoy_change_pct = ((thisYearWatts - lastYearWatts) / lastYearWatts) * 100;
      }
      
      yoy = {
        previous_year_total_watts: lastYearWatts,
        current_year_total_watts: thisYearWatts,
        yoy_change_pct: yoy_change_pct
      };
    }

    return responseFormatter.success(res, {
        last_year_watts: yoy.previous_year_total_watts || 0.0,
        this_year_watts: yoy.current_year_total_watts || 0.0,
        reduction_percentage: yoy.yoy_change_pct ? -yoy.yoy_change_pct : 0.0 // reduction is positive if consumption decreased
      }, 'Success');
  } catch (error) {
    next(error);
  }
};
