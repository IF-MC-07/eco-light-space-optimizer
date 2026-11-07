import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    room_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('ROM')
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
    building: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    floor: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    is_simulated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE'
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
