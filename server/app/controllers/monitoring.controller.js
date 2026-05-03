import db from '../models/index.js';

export const getEnergi = async (req, res) => {
  try {
    const { room_id, date } = req.query;
    let whereClause = {};

    if (room_id) whereClause.room_id = room_id;
    if (date) {
      const parsedDate = new Date(date);
      whereClause.date = parsedDate;
    }

    const data = await db.EnergyLog.findAll({
      where: whereClause,
      order: [['log_id', 'DESC']],
      include: [{ model: db.Room }]
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSensor = async (req, res) => {
  try {
    const { room_id } = req.query;
    
    let whereClause = {};
    if (room_id) {
      whereClause.room_id = room_id;
    }

    const data = await db.PowerSensor.findAll({
      limit: 10,
      order: [['read_at', 'DESC']],
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: [{ model: db.Room }]
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
