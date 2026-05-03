import db from '../models/index.js';

const { DetectionLog } = db;

export const getAll = async () => {
  return await DetectionLog.findAll();
};

export const getById = async (id) => {
  return await DetectionLog.findByPk(id);
};

export const create = async (data) => {
  return await DetectionLog.create(data);
};

export const update = async (id, data) => {
  const log = await DetectionLog.findByPk(id);
  if (!log) return null;
  return await log.update(data);
};

export const remove = async (id) => {
  const log = await DetectionLog.findByPk(id);
  if (!log) return null;
  await log.destroy();
  return true;
};
