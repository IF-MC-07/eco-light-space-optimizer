export default (sequelize, DataTypes) => {
  const AutomationSchedule = sequelize.define('AutomationSchedule', {
    schedule_id: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    schedule_name: {
      type: DataTypes.STRING(100)
    },
    start_time: {
      type: DataTypes.TIME
    },
    end_time: {
      type: DataTypes.TIME
    }
  }, {
    tableName: 'automation_schedules',
    timestamps: false,
  });

  AutomationSchedule.associate = (models) => {
    AutomationSchedule.belongsTo(models.Room, { foreignKey: 'room_id', onDelete: 'CASCADE' });
    AutomationSchedule.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'SET NULL' });
  };

  return AutomationSchedule;
};
