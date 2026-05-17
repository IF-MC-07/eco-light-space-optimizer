import db from '../models/index.js';

export const getSummary = async (req, res) => {
  try {
    const latestSensors = await db.PowerSensor.findAll({
      order: [['read_at', 'DESC']],
      limit: 20
    });
    
    const current_consumption = latestSensors.reduce((acc, sensor) => acc + (sensor.power_watts || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await db.EnergyLog.findAll({
      where: {
        date: today.toISOString().split('T')[0]
      }
    });

    const today_usage = todayLogs.reduce((acc, log) => acc + (log.total_watts || 0), 0);
    const today_saved = todayLogs.reduce((acc, log) => acc + (log.saved_watts || 0), 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyLogs = await db.EnergyLog.findAll({
      where: {
        date: {
          [db.Sequelize.Op.gte]: startOfMonth.toISOString().split('T')[0]
        }
      }
    });

    const monthly_usage = monthlyLogs.reduce((acc, log) => acc + (log.total_watts || 0), 0);
    const monthly_saved = monthlyLogs.reduce((acc, log) => acc + (log.saved_watts || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        current_consumption: parseFloat(current_consumption.toFixed(2)),
        today_usage: parseFloat(today_usage.toFixed(2)),
        today_saved: parseFloat(today_saved.toFixed(2)),
        monthly_usage: parseFloat(monthly_usage.toFixed(2)),
        monthly_saved: parseFloat(monthly_saved.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { room_id } = req.query;
    let whereClause = {};
    if (room_id) {
      whereClause.room_id = room_id;
    }

    const logs = await db.EnergyLog.findAll({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: [{ model: db.Room }],
      order: [['date', 'DESC']]
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBreakdown = async (req, res) => {
  try {
    const logs = await db.EnergyLog.findAll({
      attributes: [
        'room_id',
        [db.sequelize.fn('SUM', db.sequelize.col('total_watts')), 'total_watts'],
        [db.sequelize.fn('SUM', db.sequelize.col('saved_watts')), 'saved_watts'],
      ],
      group: ['room_id', 'Room.room_id'],
      include: [{ model: db.Room, attributes: ['room_name'] }],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('total_watts')), 'DESC']]
    });

    const formatted = logs.map(l => ({
      room_id: l.room_id,
      room_name: l.Room ? l.Room.room_name : 'Unknown Room',
      total_watts: parseFloat(Number(l.getDataValue('total_watts')).toFixed(2)),
      saved_watts: parseFloat(Number(l.getDataValue('saved_watts')).toFixed(2)),
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
