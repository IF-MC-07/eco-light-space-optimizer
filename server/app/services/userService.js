import bcrypt from 'bcrypt';
import db from '../models/index.js';

const { User } = db;
const SALT_ROUNDS = 10;

export const getAll = async () => {
  return await User.findAll({
    attributes: { exclude: ['password'] }
  });
};

export const getById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
};

export const create = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }
  const user = await User.create(data);
  const result = user.toJSON();
  delete result.password;
  return result;
};

export const update = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  await user.update(data);
  const result = user.toJSON();
  delete result.password;
  return result;
};

export const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return true;
};
