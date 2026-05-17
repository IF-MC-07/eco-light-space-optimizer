import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import db from '../models/index.js';

const { User } = db;
const SALT_ROUNDS = 10;

export const getAll = async (filters = {}) => {
  const { search, role } = filters;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { username: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (role) {
    where.role = role.toLowerCase();
  }

  return await User.findAll({
    where,
    attributes: { exclude: ['password'] },
    order: [['name', 'ASC']]
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

export const getStats = async () => {
  const totalUsers = await User.count();
  const adminCount = await User.count({ where: { role: 'admin' } });
  return {
    totalUsers,
    activeNow: Math.floor(totalUsers * 0.8), // Mock logic for now
    newThisMonth: Math.floor(totalUsers * 0.2),
    pendingRequests: 0,
    adminCount,
    activeUsers: Math.floor(totalUsers * 0.6)
  };
};
