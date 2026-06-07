import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const EnergyLog = sequelize.define('EnergyLog', {
    log_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('ENG')
    },
    room_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    total_watts: {
      type: DataTypes.FLOAT
    },
    saved_watts: {
      type: DataTypes.FLOAT
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'energy_logs',
    timestamps: false,
    indexes: [
      { fields: ['room_id'] },
      { fields: ['date'] },
      { fields: ['room_id', 'date'] }
    ]
  });

  EnergyLog.associate = (models) => {
    EnergyLog.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
  };

  return EnergyLog;
};
