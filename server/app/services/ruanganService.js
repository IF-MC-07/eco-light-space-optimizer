import db from '../models/index.js';

const { Ruangan } = db;

export const getAll = async () => {
  return await Ruangan.findAll();
};

export const getById = async (id) => {
  return await Ruangan.findByPk(id);
};

export const create = async (data) => {
  return await Ruangan.create(data);
};

export const update = async (id, data) => {
  const ruangan = await Ruangan.findByPk(id);
  if (!ruangan) return null;
  return await ruangan.update(data);
};

export const remove = async (id) => {
  const ruangan = await Ruangan.findByPk(id);
  if (!ruangan) return null;
  await ruangan.destroy();
  return true;
};
