export default (sequelize, DataTypes) => {
  const EnergyLog = sequelize.define('EnergyLog', {
    log_id: {
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
  });

  EnergyLog.associate = (models) => {
    EnergyLog.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
  };

  return EnergyLog;
};
