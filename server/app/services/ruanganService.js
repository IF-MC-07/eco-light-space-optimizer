import db from '../models/index.js';

const { Room } = db;

export const getAll = async () => {
  return await Room.findAll();
};

export const getById = async (id) => {
  return await Room.findByPk(id);
};

export const create = async (data) => {
  return await Room.create(data);
};

export const update = async (id, data) => {
  const room = await Room.findByPk(id);
  if (!room) return null;
  return await room.update(data);
};

export const remove = async (id) => {
  const room = await Room.findByPk(id);
  if (!room) return null;
  await room.destroy();
  return true;
};
