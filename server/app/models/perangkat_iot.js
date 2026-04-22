export default (sequelize, DataTypes) => {
  const PerangkatIot = sequelize.define('PerangkatIot', {
    id_perangkat: {
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
    nama_perangkat: {
      type: DataTypes.STRING(100)
    },
    tipe: {
      type: DataTypes.STRING(50)
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'aktif'
    }
  }, {
    tableName: 'perangkat_iot',
    timestamps: false,
  });

  PerangkatIot.associate = (models) => {
    PerangkatIot.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
    PerangkatIot.hasMany(models.KontrolLampu, { foreignKey: 'id_perangkat', onDelete: 'CASCADE' });
    PerangkatIot.hasMany(models.KontrolAc, { foreignKey: 'id_perangkat', onDelete: 'CASCADE' });
  };

  return PerangkatIot;
};
