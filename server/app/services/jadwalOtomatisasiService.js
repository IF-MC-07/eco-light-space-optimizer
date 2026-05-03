import db from '../models/index.js';

const { AutomationSchedule } = db;

export const getAll = async () => {
  return await AutomationSchedule.findAll();
};

export const getById = async (id) => {
  return await AutomationSchedule.findByPk(id);
};

export const create = async (data) => {
  return await AutomationSchedule.create(data);
};

export const update = async (id, data) => {
  const schedule = await AutomationSchedule.findByPk(id);
  if (!schedule) return null;
  return await schedule.update(data);
};

export const remove = async (id) => {
  const schedule = await AutomationSchedule.findByPk(id);
  if (!schedule) return null;
  await schedule.destroy();
  return true;
};
