import db from '../models/index.js';

const { SensorDaya } = db;

export const getAll = async () => {
  return await SensorDaya.findAll();
};

export const getById = async (id) => {
  return await SensorDaya.findByPk(id);
};

export const create = async (data) => {
  return await SensorDaya.create(data);
};

export const update = async (id, data) => {
  const sensor = await SensorDaya.findByPk(id);
  if (!sensor) return null;
  return await sensor.update(data);
};

export const remove = async (id) => {
  const sensor = await SensorDaya.findByPk(id);
  if (!sensor) return null;
  await sensor.destroy();
  return true;
};
