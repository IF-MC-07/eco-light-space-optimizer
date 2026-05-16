import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const Zone = sequelize.define('Zone', {
    zone_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('ZON')
    },
    room_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    zone_name: {
      type: DataTypes.STRING(100)
    },
    zone_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    },
    x1_pct: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    y1_pct: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    x2_pct: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    y2_pct: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    skew_x: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    skew_y: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'zones',
    timestamps: false,
  });

  Zone.associate = (models) => {
    Zone.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    Zone.hasMany(models.DetectionLog, { foreignKey: 'zone_id', onDelete: 'CASCADE' });
    Zone.hasMany(models.LightControl, { foreignKey: 'zone_id', onDelete: 'CASCADE' });
  };

  return Zone;
};
