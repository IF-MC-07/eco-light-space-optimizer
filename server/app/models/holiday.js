import { generateCustomId } from '../utils/idGenerator.js';

export default (sequelize, DataTypes) => {
  const Holiday = sequelize.define('Holiday', {
    holiday_id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: () => generateCustomId('HLD')
    },
    holiday_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isIn: [['nasional', 'cuti_bersama', 'kampus']]
      }
    },
    suspend_rules: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    source_ref: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'holidays',
    timestamps: false,
    indexes: [
      { fields: ['holiday_date'] },
      { unique: true, fields: ['holiday_date', 'name'] }
    ]
  });

  return Holiday;
};
