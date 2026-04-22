export default (sequelize, DataTypes) => {
  const KontrolAc = sequelize.define('KontrolAc', {
    id_kontrol_ac: {
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
    id_perangkat: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'perangkat_iot',
        key: 'id_perangkat'
      }
    },
    suhu_setting: {
      type: DataTypes.FLOAT,
      defaultValue: 24.0
    },
    status_ac: {
      type: DataTypes.STRING(20),
      defaultValue: 'off'
    },
    diperbarui_pada: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'kontrol_ac',
    timestamps: false,
  });

  KontrolAc.associate = (models) => {
    KontrolAc.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    KontrolAc.belongsTo(models.PerangkatIot, { foreignKey: 'id_perangkat', onDelete: 'CASCADE' });
  };

  return KontrolAc;
};
