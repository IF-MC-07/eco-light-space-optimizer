import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const LightControl = sequelize.define('LightControl', {
    control_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('LGT')
    },
    zone_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: 'zones',
        key: 'zone_id'
      }
    },
    device_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: 'iot_devices',
        key: 'device_id'
      }
    },
    relay_channel: {
      type: DataTypes.INTEGER
    },
    light_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'off'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'light_controls',
    timestamps: false,
  });

  LightControl.associate = (models) => {
    LightControl.belongsTo(models.Zone, { foreignKey: 'zone_id', onDelete: 'CASCADE' });
    LightControl.belongsTo(models.IotDevice, { foreignKey: 'device_id', onDelete: 'CASCADE' });
  };

  return LightControl;
};
