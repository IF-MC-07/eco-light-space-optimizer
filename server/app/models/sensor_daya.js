export default (sequelize, DataTypes) => {
  const SensorDaya = sequelize.define('SensorDaya', {
    id_sensor: {
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
    tegangan_v: {
      type: DataTypes.FLOAT
    },
    arus_a: {
      type: DataTypes.FLOAT
    },
    daya_watt: {
      type: DataTypes.FLOAT
    },
    waktu_baca: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sensor_daya',
    timestamps: false,
  });

  SensorDaya.associate = (models) => {
    SensorDaya.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
  };

  return SensorDaya;
};
