export default (sequelize, DataTypes) => {
  const JadwalOtomatisasi = sequelize.define('JadwalOtomatisasi', {
    id_jadwal: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_ruangan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ruangan',
        key: 'id_ruangan'
      }
    },
    id_pengguna: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pengguna',
        key: 'id_pengguna'
      }
    },
    nama_jadwal: {
      type: DataTypes.STRING(100)
    },
    waktu_mulai: {
      type: DataTypes.TIME
    },
    waktu_selesai: {
      type: DataTypes.TIME
    }
  }, {
    tableName: 'jadwal_otomatisasi',
    timestamps: false,
  });

  JadwalOtomatisasi.associate = (models) => {
    JadwalOtomatisasi.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    JadwalOtomatisasi.belongsTo(models.Pengguna, { foreignKey: 'id_pengguna', onDelete: 'SET NULL' });
  };

  return JadwalOtomatisasi;
};
