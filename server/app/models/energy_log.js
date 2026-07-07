import { generateCustomId } from "../utils/idGenerator.js";

export default (sequelize, DataTypes) => {

  const EnergyLog = sequelize.define("EnergyLog", {

    log_id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: () => generateCustomId("ENG")
    },

    room_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: "rooms",
        key: "room_id"
      }
    },

    voltage: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    current: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    power: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    energy: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    frequency: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    power_factor: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    total_watts: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    saved_watts: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {

    tableName: "energy_logs",
    timestamps: false

  });

  EnergyLog.associate = (models) => {

      EnergyLog.belongsTo(models.Room,{
          foreignKey:"room_id",
          onDelete:"CASCADE"
      });

  };

  return EnergyLog;

};