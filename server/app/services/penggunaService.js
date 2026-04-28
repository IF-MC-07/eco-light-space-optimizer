import bcrypt from 'bcrypt';
import db from '../models/index.js';

const { Pengguna } = db;
const SALT_ROUNDS = 10;

export const getAll = async () => {
  return await Pengguna.findAll({
    attributes: { exclude: ['kata_sandi'] }
  });
};

export const getById = async (id) => {
  return await Pengguna.findByPk(id, {
    attributes: { exclude: ['kata_sandi'] }
  });
};

export const create = async (data) => {
  if (data.kata_sandi) {
    data.kata_sandi = await bcrypt.hash(data.kata_sandi, SALT_ROUNDS);
  }
  const pengguna = await Pengguna.create(data);
  const result = pengguna.toJSON();
  delete result.kata_sandi;
  return result;
};

export const update = async (id, data) => {
  const pengguna = await Pengguna.findByPk(id);
  if (!pengguna) return null;

  if (data.kata_sandi) {
    data.kata_sandi = await bcrypt.hash(data.kata_sandi, SALT_ROUNDS);
  }

  await pengguna.update(data);
  const result = pengguna.toJSON();
  delete result.kata_sandi;
  return result;
};

export const remove = async (id) => {
  const pengguna = await Pengguna.findByPk(id);
  if (!pengguna) return null;
  await pengguna.destroy();
  return true;
};
