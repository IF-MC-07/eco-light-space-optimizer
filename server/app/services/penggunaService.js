import bcrypt from 'bcrypt';
import db from '../models/index.js';

const { Pengguna } = db;
const SALT_ROUNDS = 10;

export const getAll = async () => {
  return await Pengguna.findAll({
    attributes: { exclude: ['password'] }
  });
};

export const getById = async (id) => {
  return await Pengguna.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
};

export const create = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }
  const pengguna = await Pengguna.create(data);
  const result = pengguna.toJSON();
  delete result.password;
  return result;
};

export const update = async (id, data) => {
  const pengguna = await Pengguna.findByPk(id);
  if (!pengguna) return null;

  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  await pengguna.update(data);
  const result = pengguna.toJSON();
  delete result.password;
  return result;
};

export const remove = async (id) => {
  const pengguna = await Pengguna.findByPk(id);
  if (!pengguna) return null;
  await pengguna.destroy();
  return true;
};
