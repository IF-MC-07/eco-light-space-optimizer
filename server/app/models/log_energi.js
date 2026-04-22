export default (sequelize, DataTypes) => {
  const LogEnergi = sequelize.define('LogEnergi', {
    id_log: {
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
    total_watt: {
      type: DataTypes.FLOAT
    },
    hemat_watt: {
      type: DataTypes.FLOAT
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'log_energi',
    timestamps: false,
  });

  LogEnergi.associate = (models) => {
    LogEnergi.belongsTo(models.Ruangan, { foreignKey: 'id_ruangan', onDelete: 'CASCADE' });
  };

  return LogEnergi;
};
