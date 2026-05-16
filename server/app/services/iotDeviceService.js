import db from '../models/index.js';

const { IotDevice } = db;

export const getAll = async () => {
  return await IotDevice.findAll();
};

export const getByRoomId = async (room_id) => {
  return await IotDevice.findAll({
    where: { room_id }
  });
};

export const getById = async (id) => {
  return await IotDevice.findByPk(id);
};

export const create = async (data) => {
  return await IotDevice.create(data);
};

export const update = async (id, data) => {
  const device = await IotDevice.findByPk(id);
  if (!device) return null;
  return await device.update(data);
};

export const remove = async (id) => {
  const device = await IotDevice.findByPk(id);
  if (!device) return null;
  await device.destroy();
  return true;
};
