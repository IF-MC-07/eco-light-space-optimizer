import db from '../models/index.js';

const { LightControl } = db;

export const getAll = async () => {
  return await LightControl.findAll();
};

export const getById = async (id) => {
  return await LightControl.findByPk(id);
};

export const create = async (data) => {
  return await LightControl.create(data);
};

export const update = async (id, data) => {
  const control = await LightControl.findByPk(id);
  if (!control) return null;
  return await control.update(data);
};

export const remove = async (id) => {
  const control = await LightControl.findByPk(id);
  if (!control) return null;
  await control.destroy();
  return true;
};
