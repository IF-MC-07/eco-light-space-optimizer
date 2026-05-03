import db from '../models/index.js';

const { PowerSensor } = db;

export const getAll = async () => {
  return await PowerSensor.findAll();
};

export const getById = async (id) => {
  return await PowerSensor.findByPk(id);
};

export const create = async (data) => {
  return await PowerSensor.create(data);
};

export const update = async (id, data) => {
  const sensor = await PowerSensor.findByPk(id);
  if (!sensor) return null;
  return await sensor.update(data);
};

export const remove = async (id) => {
  const sensor = await PowerSensor.findByPk(id);
  if (!sensor) return null;
  await sensor.destroy();
  return true;
};
