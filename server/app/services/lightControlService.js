import db from '../models/index.js';
import mqttService from './mqttService.js';

const { LightControl } = db;

export const getAll = async () => {
  return await LightControl.findAll();
};

export const getById = async (id) => {
  return await LightControl.findByPk(id);
};

export const create = async (data) => {
  return await LightControl.create(data);
};

export const update = async (id, data) => {
  const control = await LightControl.findByPk(id);
  if (!control) return null;
  
  const updated = await control.update(data);
  
  // Publish MQTT if status changed
  if (data.light_status) {
    const topic = process.env.MQTT_TOPIC_CONTROL || 'kelas/control';
    const payload = {
      device_id: updated.device_id,
      relay_channel: updated.relay_channel,
      action: updated.light_status.toUpperCase()
    };
    mqttService.publish(topic, payload);
  }
  
  return updated;
};

export const remove = async (id) => {
  const control = await LightControl.findByPk(id);
  if (!control) return null;
  await control.destroy();
  return true;
};
