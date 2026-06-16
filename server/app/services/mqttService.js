import mqtt from 'mqtt';
import dotenv from 'dotenv';
import DetectionPipelineService from './detectionPipelineService.js';

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
    clientId: `server_backend_${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 5000,
  };    
    // Topics from env
    this.topics = {
      result: process.env.MQTT_TOPIC_RESULT || 'ai/inference/result',
      trigger: process.env.MQTT_TOPIC_TRIGGER || 'camera/trigger',
      control: process.env.MQTT_TOPIC_CONTROL || 'kelas/control'
    };
  }

  connect() {
    console.log(`[MQTT] Connecting to broker: ${this.brokerUrl}`);
    this.client = mqtt.connect(this.brokerUrl, this.options);

    this.client.on('connect', () => {
      console.log('[MQTT] Connected successfully');
      
      // Subscribe to relevant topics
      const subscribeTopics = [this.topics.result];
      this.client.subscribe(subscribeTopics, (err) => {
        if (!err) {
          console.log(`[MQTT] Subscribed to topics: ${subscribeTopics.join(', ')}`);
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`[MQTT] Received message on topic ${topic}`);

        if (topic === this.topics.result) {
          // Standard standardized payload (Bulk zone result)
          await DetectionPipelineService.processBulkAIResult(payload);
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
}

export default new MqttService();
