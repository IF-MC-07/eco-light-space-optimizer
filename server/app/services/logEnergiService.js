import db from '../models/index.js';

const { LogEnergi } = db;

export const getAll = async () => {
  return await LogEnergi.findAll();
};

export const getById = async (id) => {
  return await LogEnergi.findByPk(id);
};

export const create = async (data) => {
  return await LogEnergi.create(data);
};

export const update = async (id, data) => {
  const log = await LogEnergi.findByPk(id);
  if (!log) return null;
  return await log.update(data);
};

export const remove = async (id) => {
  const log = await LogEnergi.findByPk(id);
  if (!log) return null;
  await log.destroy();
  return true;
};
