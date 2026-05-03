import db from '../models/index.js';

const { Camera } = db;

export const getAll = async () => {
  return await Camera.findAll();
};

export const getById = async (id) => {
  return await Camera.findByPk(id);
};

export const create = async (data) => {
  return await Camera.create(data);
};

export const update = async (id, data) => {
  const camera = await Camera.findByPk(id);
  if (!camera) return null;
  return await camera.update(data);
};

export const remove = async (id) => {
  const camera = await Camera.findByPk(id);
  if (!camera) return null;
  await camera.destroy();
  return true;
};
