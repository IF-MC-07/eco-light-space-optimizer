export default (sequelize, DataTypes) => {
  const KontrolLampu = sequelize.define('KontrolLampu', {
    id_kontrol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_zona: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zona',
        key: 'id_zona'
      }
    },
    id_perangkat: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'perangkat_iot',
        key: 'id_perangkat'
      }
    },
    relay_channel: {
      type: DataTypes.INTEGER
    },
    status_lampu: {
      type: DataTypes.STRING(20),
      defaultValue: 'off'
    },
    diperbarui_pada: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'kontrol_lampu',
    timestamps: false,
  });

  KontrolLampu.associate = (models) => {
    KontrolLampu.belongsTo(models.Zona, { foreignKey: 'id_zona', onDelete: 'CASCADE' });
    KontrolLampu.belongsTo(models.PerangkatIot, { foreignKey: 'id_perangkat', onDelete: 'CASCADE' });
  };

  return KontrolLampu;
};
