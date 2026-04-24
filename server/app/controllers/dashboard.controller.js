import db from '../models/index.js';

export const getSummary = async (req, res) => {
  try {
    const total_ruangan = await db.Ruangan.count();
    const total_zona = await db.Zona.count();
    const total_perangkat = await db.PerangkatIot.count();
    const total_kamera = await db.Kamera.count();

    const sensor_terbaru = await db.SensorDaya.findAll({
      limit: 10,
      order: [['waktu_pencatatan', 'DESC']],
      include: [{ model: db.PerangkatIot, as: 'perangkat_iot' }]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log_energi_hari_ini = await db.LogEnergi.findAll({
      where: {
        tanggal: {
          [db.Sequelize.Op.gte]: today
        }
      },
      order: [['waktu_mulai', 'ASC']],
      include: [{ model: db.Ruangan, as: 'ruangan' }]
    });

    res.status(200).json({
      success: true,
      data: {
        total_ruangan,
        total_zona,
        total_perangkat,
        total_kamera,
        sensor_terbaru,
        log_energi_hari_ini
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
