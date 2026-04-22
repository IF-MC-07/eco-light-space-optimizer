import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Import semua model
import ruanganModel from './ruangan.js';
import penggunaModel from './pengguna.js';
import zonaModel from './zona.js';
import kameraModel from './kamera.js';
import perangkatIotModel from './perangkat_iot.js';
import sensorDayaModel from './sensor_daya.js';
import logEnergiModel from './log_energi.js';
import jadwalOtomatisasiModel from './jadwal_otomatisasi.js';
import logDeteksiModel from './log_deteksi.js';
import kontrolLampuModel from './kontrol_lampu.js';
import kontrolAcModel from './kontrol_ac.js';

// Inisialisasi model
const db = {
  Ruangan: ruanganModel(sequelize, DataTypes),
  Pengguna: penggunaModel(sequelize, DataTypes),
  Zona: zonaModel(sequelize, DataTypes),
  Kamera: kameraModel(sequelize, DataTypes),
  PerangkatIot: perangkatIotModel(sequelize, DataTypes),
  SensorDaya: sensorDayaModel(sequelize, DataTypes),
  LogEnergi: logEnergiModel(sequelize, DataTypes),
  JadwalOtomatisasi: jadwalOtomatisasiModel(sequelize, DataTypes),
  LogDeteksi: logDeteksiModel(sequelize, DataTypes),
  KontrolLampu: kontrolLampuModel(sequelize, DataTypes),
  KontrolAc: kontrolAcModel(sequelize, DataTypes)
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
