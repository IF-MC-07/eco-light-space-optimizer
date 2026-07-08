import mqtt from "mqtt";
import db from "../models/index.js";

const brokerHost = process.env.MQTT_BROKER || "localhost";
const brokerPort = process.env.MQTT_PORT || "1883";

const broker = `mqtt://${brokerHost}:${brokerPort}`;

console.log("====================================");
console.log(" MQTT ENERGY SERVICE");
console.log(" Broker :", broker);
console.log("====================================");

const client = mqtt.connect(broker);

client.on("connect", () => {

    console.log("MQTT ENERGY CONNECTED");

    client.subscribe("devices/+/energy");

});

client.on("message", async (topic, message) => {

    try {

        const payload = JSON.parse(message.toString());

        console.log("[MQTT] ENERGY RECEIVED");

        console.log(payload);

        const dateOnly = payload.timestamp.split("T")[0];

        const existing = await db.sequelize.query(
            `
            SELECT *
            FROM energy_logs
            WHERE room_id = :room_id
            AND DATE(date) = :date
            LIMIT 1
            `,
            {
                replacements:{
                    room_id: payload.room_id,
                    date: dateOnly
                },
                type: db.sequelize.QueryTypes.SELECT
            });
            const row = existing[0];

        if(row){

            await db.EnergyLog.update(
            {

                voltage: payload.voltage,

                current: payload.current,

                power: payload.power,

                energy: payload.energy,

                frequency: payload.frequency,

                power_factor: payload.pf,

                pf: payload.pf,

                total_watts: payload.power,

                recorded_at: new Date(payload.timestamp)

            },
            {
                where:{
                    log_id: row.log_id
                }
            }
            );

            console.log("Energy Updated");

        }

        else{

            await db.EnergyLog.create({

                room_id: payload.room_id,

                voltage: payload.voltage,

                current: payload.current,

                power: payload.power,

                energy: payload.energy,

                frequency: payload.frequency,

                power_factor: payload.pf,

                pf: payload.pf,

                total_watts: payload.power,

                saved_watts:0,

                date: dateOnly,

                recorded_at:new Date(payload.timestamp)

            });

            console.log("Energy Inserted");

        }

    }

    catch(err){

        console.log("[MQTT] Error");

        console.log(err);

    }

});