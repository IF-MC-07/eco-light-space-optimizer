import db from '../models/index.js';

const { LogDeteksi } = db;

export const getAll = async () => {
  return await LogDeteksi.findAll();
};

export const getById = async (id) => {
  return await LogDeteksi.findByPk(id);
};

export const create = async (data) => {
  return await LogDeteksi.create(data);
};

export const update = async (id, data) => {
  const log = await LogDeteksi.findByPk(id);
  if (!log) return null;
  return await log.update(data);
};

export const remove = async (id) => {
  const log = await LogDeteksi.findByPk(id);
  if (!log) return null;
  await log.destroy();
  return true;
};
