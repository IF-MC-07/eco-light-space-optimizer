import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    log_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('ACT')
    },
    user_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'activity_logs',
    timestamps: false,
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return ActivityLog;
};
