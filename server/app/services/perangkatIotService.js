import db from '../models/index.js';

const { PerangkatIot } = db;

export const getAll = async () => {
  return await PerangkatIot.findAll();
};

export const getById = async (id) => {
  return await PerangkatIot.findByPk(id);
};

export const create = async (data) => {
  return await PerangkatIot.create(data);
};

export const update = async (id, data) => {
  const perangkat = await PerangkatIot.findByPk(id);
  if (!perangkat) return null;
  return await perangkat.update(data);
};

export const remove = async (id) => {
  const perangkat = await PerangkatIot.findByPk(id);
  if (!perangkat) return null;
  await perangkat.destroy();
  return true;
};
