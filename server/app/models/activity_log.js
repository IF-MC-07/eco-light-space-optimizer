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
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    status_code: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    resource_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resource_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'activity_logs',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['timestamp'] }
    ]
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return ActivityLog;
};
