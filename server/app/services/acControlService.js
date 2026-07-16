import db from '../models/index.js';
import mqttService from './mqttService.js';

const { AcControl } = db;

export const getAll = async () => {
  return await AcControl.findAll();
};

export const getById = async (id) => {
  return await AcControl.findByPk(id);
};

export const create = async (data) => {
  return await AcControl.create(data);
};

export const update = async (id, data) => {
  const control = await AcControl.findByPk(id);
  if (!control) return null;
  
  const updated = await control.update(data);
  
  // Publish MQTT if status or temperature changed
  if (data.ac_status !== undefined || data.temperature_setting !== undefined) {
    const topic = `devices/${updated.room_id}/ac`;
    const payload = {
      command: updated.ac_status.toUpperCase(),
      room_id: updated.room_id,
      temperature: parseFloat(updated.temperature_setting || 24.0),
      source: "admin_override",
      timestamp: new Date().toISOString()
    };
    mqttService.publish(topic, payload);
  }
  
  return updated;
};

export const remove = async (id) => {
  const control = await AcControl.findByPk(id);
  if (!control) return null;
  await control.destroy();
  return true;
};

