export default (sequelize, DataTypes) => {
  const Pengguna = sequelize.define('Pengguna', {
    id_pengguna: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    kata_sandi: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    peran: {
      type: DataTypes.STRING(20),
      defaultValue: 'user'
    }
  }, {
    tableName: 'pengguna',
    timestamps: false,
  });

  Pengguna.associate = (models) => {
    Pengguna.hasMany(models.JadwalOtomatisasi, { foreignKey: 'id_pengguna', onDelete: 'SET NULL' });
  };

  return Pengguna;
};
