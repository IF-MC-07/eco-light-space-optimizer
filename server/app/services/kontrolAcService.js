import db from '../models/index.js';

const { KontrolAc } = db;

export const getAll = async () => {
  return await KontrolAc.findAll();
};

export const getById = async (id) => {
  return await KontrolAc.findByPk(id);
};

export const create = async (data) => {
  return await KontrolAc.create(data);
};

export const update = async (id, data) => {
  const kontrol = await KontrolAc.findByPk(id);
  if (!kontrol) return null;
  return await kontrol.update(data);
};

export const remove = async (id) => {
  const kontrol = await KontrolAc.findByPk(id);
  if (!kontrol) return null;
  await kontrol.destroy();
  return true;
};
