export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user'
    }
  }, {
    tableName: 'users',
    timestamps: false,
  });

  User.associate = (models) => {
    User.hasMany(models.AutomationSchedule, { foreignKey: 'user_id', onDelete: 'SET NULL' });
  };

  return User;
};
