import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Import semua model
import roomModel from "./room.js";
import userModel from "./user.js";
import zoneModel from "./zone.js";
import cameraModel from "./camera.js";
import iotDeviceModel from "./iot_device.js";
import powerSensorModel from "./power_sensor.js";
import energyLogModel from "./energy_log.js";
import automationScheduleModel from "./automation_schedule.js";
import detectionLogModel from "./detection_log.js";
import lightControlModel from "./light_control.js";
import acControlModel from "./ac_control.js";
import activityLogModel from "./activity_log.js";

// Inisialisasi model
const db = {
  Room: roomModel(sequelize, DataTypes),
  User: userModel(sequelize, DataTypes),
  Zone: zoneModel(sequelize, DataTypes),
  Camera: cameraModel(sequelize, DataTypes),
  IotDevice: iotDeviceModel(sequelize, DataTypes),
  PowerSensor: powerSensorModel(sequelize, DataTypes),
  EnergyLog: energyLogModel(sequelize, DataTypes),
  AutomationSchedule: automationScheduleModel(sequelize, DataTypes),
  DetectionLog: detectionLogModel(sequelize, DataTypes),
  LightControl: lightControlModel(sequelize, DataTypes),
  AcControl: acControlModel(sequelize, DataTypes),
  ActivityLog: activityLogModel(sequelize, DataTypes),
};

// Jalankan asosiasi model jika ada
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize; // Opsional jika butuh Op dll

export default db;
export { sequelize };
