import db from '../models/index.js';

const { AcControl } = db;

export const getAll = async () => {
  return await AcControl.findAll();
};

export const getById = async (id) => {
  return await AcControl.findByPk(id);
};

export const create = async (data) => {
  return await AcControl.create(data);
};

export const update = async (id, data) => {
  const control = await AcControl.findByPk(id);
  if (!control) return null;
  return await control.update(data);
};

export const remove = async (id) => {
  const control = await AcControl.findByPk(id);
  if (!control) return null;
  await control.destroy();
  return true;
};
