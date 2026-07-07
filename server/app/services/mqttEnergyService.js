import mqtt from "mqtt";
import db from "../models/index.js";

const broker = process.env.MQTT_BROKER || "mqtt://localhost";

const client = mqtt.connect(broker);

client.on("connect", () => {

    console.log("====================================");
    console.log("MQTT ENERGY SERVICE CONNECTED");
    console.log("====================================");

    client.subscribe("devices/+/energy");

});

client.on("message", async(topic,message)=>{

    try{

        const payload = JSON.parse(message.toString());

        console.log("ENERGY RECEIVED");

        console.log(payload);

        await db.EnergyLog.create({

            room_id: payload.room_id,

            voltage: payload.voltage,

            current: payload.current,

            power: payload.power,

            energy: payload.energy,

            frequency: payload.frequency,

            power_factor: payload.pf,

            total_watts: payload.power,

            saved_watts: 0,

            date: new Date(payload.timestamp)

        });

        console.log("SUCCESS SAVE ENERGY");

    }

    catch(err){

        console.log(err);

    }

});