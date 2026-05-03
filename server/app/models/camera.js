export default (sequelize, DataTypes) => {
  const Camera = sequelize.define('Camera', {
    camera_id: {
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
    ip_address: {
      type: DataTypes.STRING(50)
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
