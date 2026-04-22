export default (sequelize, DataTypes) => {
  const LogDeteksi = sequelize.define('LogDeteksi', {
    id_deteksi: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_kamera: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'kamera',
        key: 'id_kamera'
      }
    },
    id_zona: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zona',
        key: 'id_zona'
      }
    },
    jumlah_orang: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status_zona: {
      type: DataTypes.STRING(20)
    },
    waktu_deteksi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'log_deteksi',
    timestamps: false,
  });

  LogDeteksi.associate = (models) => {
    LogDeteksi.belongsTo(models.Kamera, { foreignKey: 'id_kamera', onDelete: 'CASCADE' });
    LogDeteksi.belongsTo(models.Zona, { foreignKey: 'id_zona', onDelete: 'CASCADE' });
  };

  return LogDeteksi;
};
