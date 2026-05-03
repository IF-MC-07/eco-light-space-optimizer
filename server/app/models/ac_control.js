export default (sequelize, DataTypes) => {
  const AcControl = sequelize.define('AcControl', {
    ac_control_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'room_id'
      }
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'iot_devices',
        key: 'device_id'
      }
    },
    temperature_setting: {
      type: DataTypes.FLOAT,
      defaultValue: 24.0
    },
    ac_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'off'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ac_controls',
    timestamps: false,
  });

  AcControl.associate = (models) => {
    AcControl.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    AcControl.belongsTo(models.IotDevice, { foreignKey: 'device_id', onDelete: 'CASCADE' });
  };

  return AcControl;
};
