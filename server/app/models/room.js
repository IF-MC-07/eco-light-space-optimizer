export default (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    room_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100)
    },
    capacity: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'rooms',
    timestamps: false,
  });

  Room.associate = (models) => {
    Room.hasMany(models.Zone, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.Camera, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.IotDevice, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.PowerSensor, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.EnergyLog, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.AutomationSchedule, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Room.hasMany(models.AcControl, { foreignKey: 'room_id', onDelete: 'CASCADE' });
  };

  return Room;
};
