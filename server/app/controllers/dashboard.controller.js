import responseFormatter from "../utils/response.js";
import db from "../models/index.js";

export const getSummary = async (req, res, next) => {
  try {
    const total_rooms = await db.Room.count();
    const total_zones = await db.Zone.count();
    const total_devices = await db.IotDevice.count();
    const total_cameras = await db.Camera.count();

    const latest_sensors = await db.PowerSensor.findAll({
      limit: 10,
      order: [["read_at", "DESC"]],
      include: [{ model: db.Room }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todays_energy_logs = await db.EnergyLog.findAll({
      where: {
        date: {
          [db.Sequelize.Op.gte]: today,
        },
      },
      order: [["log_id", "ASC"]],
      include: [{ model: db.Room }],
    });

    // Control statistics
    const lights_active = await db.LightControl.count({
      where: {
        light_status: ["on", "active", "ON", "ACTIVE"],
      },
    });

    const lights_total = await db.LightControl.count();

    const ac_units_running = await db.AcControl.count({
      where: {
        ac_status: ["on", "active", "ON", "ACTIVE"],
      },
    });

    const ac_total = await db.AcControl.count();

    const result = await db.AcControl.findOne({
      attributes: [
        [
          db.Sequelize.fn("AVG", db.Sequelize.col("temperature_setting")),
          "avg_temp",
        ],
      ],
      raw: true,
    });
    const avg_temperature = result?.avg_temp
      ? parseFloat(Number(result.avg_temp).toFixed(1))
      : 24.0;

    return responseFormatter.success(
      res,
      {
        total_rooms,
        total_zones,
        total_devices,
        total_cameras,
        latest_sensors,
        todays_energy_logs,
        lights_active,
        lights_total,
        ac_units_running,
        ac_total,
        avg_temperature,
      },
      "Success",
    );
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const lights_active = await db.LightControl.count({
      where: {
        light_status: ["on", "active", "ON", "ACTIVE"],
      },
    });

    const lights_total = await db.LightControl.count();

    const ac_units_running = await db.AcControl.count({
      where: {
        ac_status: ["on", "active", "ON", "ACTIVE"],
      },
    });

    const result = await db.AcControl.findOne({
      attributes: [
        [
          db.Sequelize.fn("AVG", db.Sequelize.col("temperature_setting")),
          "avg_temp",
        ],
      ],
      raw: true,
    });
    const avg_temperature = result?.avg_temp
      ? parseFloat(Number(result.avg_temp).toFixed(1))
      : 24.0;

    return responseFormatter.success(
      res,
      {
        lights_active,
        lights_total,
        ac_units_running,
        avg_temperature,
        energy_mode: "ECO",
      },
      "Success",
    );
  } catch (error) {
    next(error);
  }
};
