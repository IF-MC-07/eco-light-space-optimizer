import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const DetectionLog = sequelize.define('DetectionLog', {
    detection_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('DET')
    },
    camera_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'cameras',
        key: 'camera_id'
      }
    },
    zone_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'zones',
        key: 'zone_id'
      }
    },
    occupancy_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    zone_status: {
      type: DataTypes.STRING(20)
    },
    detection_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'detection_logs',
    timestamps: false,
  });

  DetectionLog.associate = (models) => {
    DetectionLog.belongsTo(models.Camera, { foreignKey: 'camera_id', onDelete: 'CASCADE' });
    DetectionLog.belongsTo(models.Zone, { foreignKey: 'zone_id', onDelete: 'CASCADE' });
  };

  return DetectionLog;
};
