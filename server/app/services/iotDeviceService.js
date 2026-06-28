import db from '../models/index.js';

const { IotDevice } = db;

// Normalize: frontend sends device_type, DB stores as type.
// This helper maps the payload before writing to DB.
const normalizeInput = (data) => {
  const normalized = { ...data };
  if (normalized.device_type !== undefined && normalized.type === undefined) {
    normalized.type = normalized.device_type;
    delete normalized.device_type;
  }
  return normalized;
};

// Normalize: add device_type alias so frontend can always read device_type
const normalizeOutput = (device) => {
  if (!device) return null;
  const plain = device.get ? device.get({ plain: true }) : { ...device };
  if (plain.type !== undefined && plain.device_type === undefined) {
    plain.device_type = plain.type;
  }
  return plain;
};

export const getAll = async () => {
  const records = await IotDevice.findAll();
  return records.map(normalizeOutput);
};

export const getByRoomId = async (room_id) => {
  const records = await IotDevice.findAll({ where: { room_id } });
  return records.map(normalizeOutput);
};

export const getById = async (id) => {
  return normalizeOutput(await IotDevice.findByPk(id));
};

export const create = async (data) => {
  return normalizeOutput(await IotDevice.create(normalizeInput(data)));
};

export const update = async (id, data) => {
  const device = await IotDevice.findByPk(id);
  if (!device) return null;
  return normalizeOutput(await device.update(normalizeInput(data)));
};

export const remove = async (id) => {
  const device = await IotDevice.findByPk(id);
  if (!device) return null;
  await device.destroy();
  return true;
};
