import db from '../models/index.js';

export const getSummary = async (req, res) => {
  try {
    const logs = await db.EnergyLog.findAll();
    const total_saved = logs.reduce((acc, log) => acc + (log.saved_watts || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await db.EnergyLog.findAll({
      where: { date: today.toISOString().split('T')[0] }
    });
    const today_saved = todayLogs.reduce((acc, log) => acc + (log.saved_watts || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        total_saved_watts: parseFloat(total_saved.toFixed(2)),
        today_saved_watts: parseFloat(today_saved.toFixed(2)),
        co2_saved_kg: parseFloat((total_saved * 0.0007).toFixed(2)),
        cost_saved_idr: Math.round(total_saved * 1500)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBreakdown = async (req, res) => {
  try {
    const logs = await db.EnergyLog.findAll({
      attributes: [
        'room_id',
        [db.sequelize.fn('SUM', db.sequelize.col('saved_watts')), 'saved_watts'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_watts')), 'total_watts'],
      ],
      group: ['room_id', 'Room.room_id'],
      include: [{ model: db.Room, attributes: ['room_name'] }],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('saved_watts')), 'DESC']]
    });

    const formatted = logs.map(l => ({
      room_id: l.room_id,
      room_name: l.Room ? l.Room.room_name : 'Unknown Room',
      saved_watts: parseFloat(Number(l.getDataValue('saved_watts')).toFixed(2)),
      total_watts: parseFloat(Number(l.getDataValue('total_watts')).toFixed(2)),
      percentage: l.getDataValue('total_watts') > 0 ? parseFloat(((Number(l.getDataValue('saved_watts')) / Number(l.getDataValue('total_watts'))) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrend = async (req, res) => {
  try {
    const logs = await db.EnergyLog.findAll({
      attributes: [
        'date',
        [db.sequelize.fn('SUM', db.sequelize.col('saved_watts')), 'saved_watts'],
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      limit: 7
    });

    const formatted = logs.map(l => ({
      date: l.date,
      saved_watts: parseFloat(Number(l.getDataValue('saved_watts')).toFixed(2))
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getYoY = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        last_year_watts: 450000,
        this_year_watts: 320000,
        reduction_percentage: 28.8
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
