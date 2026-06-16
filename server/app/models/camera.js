import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const Camera = sequelize.define('Camera', {
    camera_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('CAM')
    },
    room_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    ip_address: {
      type: DataTypes.TEXT
    },
    camera_hash: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    resolution: {
      type: DataTypes.STRING(20)
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'cameras',
    timestamps: false,
  });

  Camera.associate = (models) => {
    Camera.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Camera.hasMany(models.DetectionLog, { foreignKey: 'camera_id', onDelete: 'CASCADE' });
  };

  return Camera;
};
