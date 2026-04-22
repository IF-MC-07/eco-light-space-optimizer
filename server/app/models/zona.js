export default (sequelize, DataTypes) => {
  const Zona = sequelize.define('Zona', {
    id_zona: {
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
    nama_zona: {
      type: DataTypes.STRING(100)
    },
    status_zona: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'zona',
    timestamps: false,
  });

  Zona.associate = (models) => {
    Zona.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    Zona.hasMany(models.LogDeteksi, { foreignKey: 'id_zona', onDelete: 'CASCADE' });
    Zona.hasMany(models.KontrolLampu, { foreignKey: 'id_zona', onDelete: 'CASCADE' });
  };

  return Zona;
};
