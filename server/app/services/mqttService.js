import mqtt from 'mqtt';
import dotenv from 'dotenv';
import DetectionPipelineService from './detectionPipelineService.js';
import db from '../models/index.js';

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
      energy: 'devices/+/energy'
    };
  }

  connect() {
    console.log(`[MQTT] Connecting to broker: ${this.brokerUrl}`);
    this.client = mqtt.connect(this.brokerUrl, this.options);

    this.client.on('connect', () => {
      console.log('[MQTT] Connected successfully');
      
      // Subscribe to relevant topics
      const subscribeTopics = [this.topics.result, this.topics.deviceStatus, this.topics.energy];
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
          await this.handleEnergyData(topic, payload);
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

  async handleEnergyData(topic, rawMessage) {
    try {
      let payload;
      if (typeof rawMessage === 'string') {
        payload = JSON.parse(rawMessage);
      } else if (Buffer.isBuffer(rawMessage)) {
        payload = JSON.parse(rawMessage.toString());
      } else {
        payload = rawMessage;
      }

      const topicString = topic.toString();
      const parts = topicString.split('/');
      const roomId = payload.room_id || parts[1];

      const device = await db.IotDevice.findOne({ where: { room_id: roomId } });
      if (!device) {
        console.warn(`[MQTT] Device with room_id ${roomId} not found.`);
      }

      const recordedAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

      if (db.EnergyLog) {
        await db.EnergyLog.create({
          room_id: roomId,
          voltage: payload.voltage,
          current: payload.current,
          power: payload.power,
          energy: payload.energy,
          frequency: payload.frequency,
          pf: payload.pf,
          recorded_at: recordedAt
        });
      } else {
        const query = `
          INSERT INTO energy_logs (room_id, voltage, current, power, energy, frequency, pf, recorded_at)
          VALUES (:room_id, :voltage, :current, :power, :energy, :frequency, :pf, :recorded_at)
        `;
        await db.sequelize.query(query, {
          replacements: {
            room_id: roomId,
            voltage: payload.voltage,
            current: payload.current,
            power: payload.power,
            energy: payload.energy,
            frequency: payload.frequency,
            pf: payload.pf,
            recorded_at: recordedAt
          },
          type: db.sequelize.QueryTypes.INSERT
        });
      }

      console.log(`[MQTT] Energy data saved for room ${roomId}`);
    } catch (error) {
      console.error(`[MQTT] Error handling energy data:`, error.message);
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
      const device = await db.IotDevice.findOne({ where: { device_id: deviceId } });
      if (!device) {
        console.warn(`[MQTT] Device ${deviceId} not found in DB for status update.`);
        return;
      }

      const updateData = { status: status }; // 'online' or 'offline'
      if (status === 'online') {
        updateData.last_seen = new Date();
      }

      await device.update(updateData);

      await db.ActivityLog.create({
        action: status === 'online' ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE',
        details: `Device ${deviceId} is now ${status}`,
        resource_id: deviceId,
        resource_type: 'IotDevice'
      });

      console.log(`[MQTT] Device ${deviceId} status updated to ${status}`);
    } catch (error) {
      console.error(`[MQTT] Error updating device status:`, error.message);
    }
  }
}

export default new MqttService();
