import db from '../models/index.js';

export const getEnergi = async (req, res) => {
  try {
    const { id_ruangan, tanggal } = req.query;
    let whereClause = {};

    if (id_ruangan) whereClause.id_ruangan = id_ruangan;
    if (tanggal) {
      const date = new Date(tanggal);
      whereClause.tanggal = date;
    }

    const data = await db.LogEnergi.findAll({
      where: whereClause,
      order: [['waktu_mulai', 'DESC']],
      include: [{ model: db.Ruangan, as: 'ruangan' }]
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSensor = async (req, res) => {
  try {
    const { id_ruangan } = req.query;
    
    let perangkatWhere = {};
    if (id_ruangan) {
      perangkatWhere.id_ruangan = id_ruangan;
    }

    const data = await db.SensorDaya.findAll({
      limit: 10,
      order: [['waktu_pencatatan', 'DESC']],
      include: [
        { 
          model: db.PerangkatIot, 
          as: 'perangkat_iot',
          where: Object.keys(perangkatWhere).length > 0 ? perangkatWhere : undefined,
          include: [{ model: db.Ruangan, as: 'ruangan' }]
        }
      ]
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
