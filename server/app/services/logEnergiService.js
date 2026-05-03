import db from '../models/index.js';

const { EnergyLog } = db;

export const getAll = async () => {
  return await EnergyLog.findAll();
};

export const getById = async (id) => {
  return await EnergyLog.findByPk(id);
};

export const create = async (data) => {
  return await EnergyLog.create(data);
};

export const update = async (id, data) => {
  const log = await EnergyLog.findByPk(id);
  if (!log) return null;
  return await log.update(data);
};

export const remove = async (id) => {
  const log = await EnergyLog.findByPk(id);
  if (!log) return null;
  await log.destroy();
  return true;
};
