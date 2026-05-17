import db from '../models/index.js';

export const getSummary = async (req, res) => {
  try {
    const total_rooms = await db.Room.count();
    const total_zones = await db.Zone.count();
    const total_devices = await db.IotDevice.count();
    const total_cameras = await db.Camera.count();

    const latest_sensors = await db.PowerSensor.findAll({
      limit: 10,
      order: [['read_at', 'DESC']],
      include: [{ model: db.Room }]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todays_energy_logs = await db.EnergyLog.findAll({
      where: {
        date: {
          [db.Sequelize.Op.gte]: today
        }
      },
      order: [['log_id', 'ASC']],
      include: [{ model: db.Room }]
    });

    res.status(200).json({
      success: true,
      data: {
        total_rooms,
        total_zones,
        total_devices,
        total_cameras,
        latest_sensors,
        todays_energy_logs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const lights_active = await db.LightControl.count({
      where: {
        light_status: ['on', 'active', 'ON', 'ACTIVE']
      }
    });

    const lights_total = await db.LightControl.count();

    const ac_units_running = await db.AcControl.count({
      where: {
        ac_status: ['on', 'active', 'ON', 'ACTIVE']
      }
    });

    const avg_temp_val = await db.AcControl.avg('temperature_setting');
    const avg_temperature = avg_temp_val ? parseFloat(Number(avg_temp_val).toFixed(1)) : 24.0;

    res.status(200).json({
      success: true,
      data: {
        lights_active,
        lights_total,
        ac_units_running,
        avg_temperature,
        energy_mode: "ECO"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

