import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId('USR')
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
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
      allowNull: false,
      defaultValue: 'user'
    },
    avatar: {
      type: DataTypes.TEXT, // Base64 or URL
      allowNull: true
    },
    email_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    system_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    daily_digest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
