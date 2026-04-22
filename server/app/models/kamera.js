export default (sequelize, DataTypes) => {
  const Kamera = sequelize.define('Kamera', {
    id_kamera: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_ruangan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ruangan',
        key: 'id_ruangan'
      }
    },
    ip_address: {
      type: DataTypes.STRING(50)
    },
    resolusi: {
      type: DataTypes.STRING(20)
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'kamera',
    timestamps: false,
  });

  Kamera.associate = (models) => {
    Kamera.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Kamera.hasMany(models.LogDeteksi, { foreignKey: 'id_kamera', onDelete: 'CASCADE' });
  };

  return Kamera;
};
