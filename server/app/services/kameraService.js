import db from '../models/index.js';

const { Kamera } = db;

export const getAll = async () => {
  return await Kamera.findAll();
};

export const getById = async (id) => {
  return await Kamera.findByPk(id);
};

export const create = async (data) => {
  return await Kamera.create(data);
};

export const update = async (id, data) => {
  const kamera = await Kamera.findByPk(id);
  if (!kamera) return null;
  return await kamera.update(data);
};

export const remove = async (id) => {
  const kamera = await Kamera.findByPk(id);
  if (!kamera) return null;
  await kamera.destroy();
  return true;
};
