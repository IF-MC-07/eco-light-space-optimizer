import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const PowerSensor = sequelize.define('PowerSensor', {
    sensor_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('PWR')
    },
    room_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    voltage_v: {
      type: DataTypes.FLOAT
    },
    current_a: {
      type: DataTypes.FLOAT
    },
    power_watts: {
      type: DataTypes.FLOAT
    },
    read_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'power_sensors',
    timestamps: false,
  });

  PowerSensor.associate = (models) => {
    PowerSensor.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
  };

  return PowerSensor;
};
