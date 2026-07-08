import mqtt from 'mqtt';
import dotenv from 'dotenv';
import DetectionPipelineService from './detectionPipelineService.js';
import db from '../models/index.js';
import { generateCustomId } from "../utils/idGenerator.js";

dotenv.config();

/**
 * MQTT Service
 * Handles connection to broker and routing messages to the pipeline.
 */
class MqttService {
  constructor() {
    this.client = null;
    this.brokerUrl = process.env.MQTT_BROKER_URL || `mqtt://${process.env.MQTT_BROKER || 'localhost'}:${process.env.MQTT_PORT || 1883}`;
    this.options = {

      username: process.env.MQTT_USER || process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      clientId: `server_backend_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
    };

    // Topics from env
    this.topics = {
      result: process.env.MQTT_TOPIC_RESULT || 'ai/inference/result/#',
      trigger: process.env.MQTT_TOPIC_TRIGGER || 'camera/trigger',
      control: process.env.MQTT_TOPIC_CONTROL || 'kelas/control',
      deviceStatus: 'devices/+/status/+',
      energy: 'devices/+/energy',
      relayStatus: 'devices/+/relay/status'
    };
  }

  connect() {
    console.log(`[MQTT] Connecting to broker: ${this.brokerUrl}`);
    this.client = mqtt.connect(this.brokerUrl, this.options);

    this.client.on('connect', () => {
      console.log('[MQTT] Connected successfully');

      // Subscribe to relevant topics
      const subscribeTopics = [this.topics.result, this.topics.deviceStatus, this.topics.energy, this.topics.relayStatus];
      this.client.subscribe(subscribeTopics, (err) => {
        if (!err) {
          console.log(`[MQTT] Subscribed to topics: ${subscribeTopics.join(', ')}`);
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const topicString = topic.toString();

        // Handle Device Status (LWT & Online)
        if (topicString.startsWith('devices/') && topicString.includes('/status/')) {
          const parts = topicString.split('/');
          if (parts.length >= 4) {
            const deviceId = parts[1];
            const statusType = parts[3]; // 'online' or 'offline'
            await this.handleDeviceStatusChange(deviceId, statusType);
            return;
          }
        }

        const payload = JSON.parse(message.toString());
        console.log(`[MQTT] Received message on topic ${topic}`);

        if (topicString.startsWith('devices/') && topicString.endsWith('/energy')) {
          await this.handleEnergyData(topicString, payload);
          return;
        }
        
        if (
          topicString.startsWith('devices/') &&
          topicString.endsWith('/relay/status')
        ) {
          await this.handleRelayStatus(payload);
          return;
        }

        const baseResultTopic = this.topics.result.replace('/#', '');
        if (topic.startsWith(baseResultTopic)) {
          // Parse camera_id from topic (e.g. ai/inference/result/CAM-001 -> CAM-001)
          const topicParts = topic.split('/');
          const cameraId = topicParts[topicParts.length - 1];
          payload.camera_id = cameraId;

          // Standard standardized payload (Bulk zone result)
          await DetectionPipelineService.processBulkAIResult(payload, cameraId);
        }
      } catch (error) {
        console.error(`[MQTT] Error handling message on ${topic}:`, error.message);
      }
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
    });

    this.client.on('close', () => {
      console.log('[MQTT] Connection closed');
    });
  }

  async handleEnergyData(topic, payload) {
    try {
      const topicString = topic.toString();
      const parts = topicString.split('/');
      const roomId = payload.room_id || parts[1];
      const sensorId = generateCustomId("PWR");
      const powerWatts = payload.power_watts ?? payload.power ?? 0;
      const voltageV = payload.voltage_v ?? payload.voltage ?? 0;
      const currentA = payload.current_a ?? payload.current ?? 0;
      const recordedAt = payload.read_at
        ? new Date(payload.read_at)
        : payload.timestamp
          ? new Date(payload.timestamp)
          : new Date();

      const insertPowerSensorQuery = `
        INSERT INTO power_sensors (sensor_id, room_id, voltage_v, current_a, power_watts, read_at)
        VALUES (:sensor_id, :room_id, :voltage_v, :current_a, :power_watts, :read_at)
      `;
      await db.sequelize.query(insertPowerSensorQuery, {
        replacements: {
          sensor_id: sensorId,
          room_id: roomId,
          voltage_v: voltageV,
          current_a: currentA,
          power_watts: powerWatts,
          read_at: recordedAt
        },
        type: db.sequelize.QueryTypes.INSERT
      });

      const totalWattsQuery = `
        SELECT (power_watts)
        FROM power_sensors
        WHERE room_id = :room_id ORDER BY read_at DESC 
        LIMIT 1
      `;
      const [totalResult] = await db.sequelize.query(totalWattsQuery, {
        replacements: { room_id: roomId },
        type: db.sequelize.QueryTypes.SELECT
      });
      const totalWatts = totalResult ? parseFloat(totalResult.power_watts) || 0 : 0;

      const savedWattsQuery = `
        SELECT COUNT(*) as relays_off
        FROM light_controls
        WHERE zone_id IN (
          SELECT zone_id FROM zones WHERE room_id = :room_id
        )
        AND light_status = 'off'
      `;
      const [savedResult] = await db.sequelize.query(savedWattsQuery, {
        replacements: { room_id: roomId },
        type: db.sequelize.QueryTypes.SELECT
      });
      const relaysOff = savedResult ? parseInt(savedResult.relays_off) || 0 : 0;
      const savedWatts = relaysOff * 5.0;

      const logId = generateCustomId("ENG");
      const upsertEnergyLogQuery = `

        INSERT INTO energy_logs (log_id, room_id, total_watts, saved_watts, date)
        VALUES (:log_id,:room_id, :total_watts, :saved_watts, CURRENT_DATE)
        ON CONFLICT (room_id, date)
        DO UPDATE SET 
          total_watts = EXCLUDED.total_watts,
          saved_watts = EXCLUDED.saved_watts
      `;
      await db.sequelize.query(upsertEnergyLogQuery, {
        replacements: {
          log_id: logId,
          room_id: roomId,
          total_watts: totalWatts,
          saved_watts: savedWatts
        }
      });

      console.log(`[MQTT] Energy saved: room=${roomId} power=${powerWatts}W`);
      console.log(`[MQTT] Energy log updated: total=${totalWatts}W saved=${savedWatts}W`);

    } catch (error) {
      console.error("========== ENERGY ERROR ==========");
      console.error(error);

      if (error.errors) {
        console.error("Validation Errors:");
        error.errors.forEach(err => {
          console.error(
            `Field: ${err.path}, Value: ${err.value}, Message: ${err.message}`
          );
        });
      }

      console.error("Parent:", error.parent);
      console.error("Original:", error.original);
    }
  }

  publish(topic, payload) {

    if (!this.client || !this.client.connected) {
      console.warn(`[MQTT] Cannot publish to ${topic}: Client not connected`);
      return false;
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Publish error on ${topic}:`, err);
      } else {
        console.log(`[MQTT] Published to ${topic}:`, message);
      }
    });
    return true;
  }

  async handleDeviceStatusChange(deviceId, status) {
  try {

    let device = await db.IotDevice.findOne({
      where: {
        room_id: deviceId
      }
    });

    // jika belum ada device -> otomatis buat
    if (!device) {

      device = await db.IotDevice.create({

        room_id: deviceId,

        device_name: `ESP32 ${deviceId}`,

        type: "ESP32",

        status: status,

        last_seen: new Date()

      });

      console.log(`[MQTT] Device baru berhasil dibuat untuk room ${deviceId}`);

    }

    else {

      await device.update({

        status: status,

        last_seen: new Date()

      });

      console.log(`[MQTT] Device ${device.device_id} berhasil diupdate`);

    }

  }

  catch(err){

    console.error(err);

  }
}
}

export default new MqttService();
