import db from '../models/index.js';

const { KontrolLampu } = db;

export const getAll = async () => {
  return await KontrolLampu.findAll();
};

export const getById = async (id) => {
  return await KontrolLampu.findByPk(id);
};

export const create = async (data) => {
  return await KontrolLampu.create(data);
};

export const update = async (id, data) => {
  const kontrol = await KontrolLampu.findByPk(id);
  if (!kontrol) return null;
  return await kontrol.update(data);
};

export const remove = async (id) => {
  const kontrol = await KontrolLampu.findByPk(id);
  if (!kontrol) return null;
  await kontrol.destroy();
  return true;
};
