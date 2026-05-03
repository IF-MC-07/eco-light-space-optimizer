export default (sequelize, DataTypes) => {
  const IotDevice = sequelize.define('IotDevice', {
    device_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    device_name: {
      type: DataTypes.STRING(100)
    },
    type: {
      type: DataTypes.STRING(50)
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'iot_devices',
    timestamps: false,
  });

  IotDevice.associate = (models) => {
    IotDevice.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    IotDevice.hasMany(models.LightControl, { foreignKey: 'device_id', onDelete: 'CASCADE' });
    IotDevice.hasMany(models.AcControl, { foreignKey: 'device_id', onDelete: 'CASCADE' });
  };

  return IotDevice;
};
