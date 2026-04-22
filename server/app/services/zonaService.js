import db from '../models/index.js';

const { Zona } = db;

export const getAll = async () => {
  return await Zona.findAll();
};

export const getById = async (id) => {
  return await Zona.findByPk(id);
};

export const create = async (data) => {
  return await Zona.create(data);
};

export const update = async (id, data) => {
  const zona = await Zona.findByPk(id);
  if (!zona) return null;
  return await zona.update(data);
};

export const remove = async (id) => {
  const zona = await Zona.findByPk(id);
  if (!zona) return null;
  await zona.destroy();
  return true;
};
