export default (sequelize, DataTypes) => {
  const Ruangan = sequelize.define('Ruangan', {
    id_ruangan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_ruangan: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lokasi: {
      type: DataTypes.STRING(100)
    },
    kapasitas: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'ruangan',
    timestamps: false,
  });

  Ruangan.associate = (models) => {
    Ruangan.hasMany(models.Zona, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.Kamera, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.PerangkatIot, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.SensorDaya, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.LogEnergi, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.JadwalOtomatisasi, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Ruangan.hasMany(models.KontrolAc, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
  };

  return Ruangan;
};
