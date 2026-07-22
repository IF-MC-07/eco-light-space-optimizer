import db from '../models/index.js';
import automationScheduler from './automationScheduler.js';

const { AutomationSchedule } = db;

/**
 * Automation Schedule Service
 * Menangani CRUD untuk jadwal otomasi
 */

export const getAll = async () => {
  return await AutomationSchedule.findAll({
    order: [['start_time', 'ASC']]
  });
};

export const getById = async (id) => {
  return await AutomationSchedule.findByPk(id);
};

export const create = async (data) => {
  const schedule = await AutomationSchedule.create(data);
  
  // Reload scheduler setelah schedule baru dibuat
  automationScheduler.reloadAll();
  
  return schedule;
};

export const update = async (id, data) => {
  const schedule = await AutomationSchedule.findByPk(id);
  if (!schedule) return null;

  const updatedSchedule = await schedule.update(data);
  
  // Reload scheduler setelah update
  automationScheduler.reloadAll();
  
  return updatedSchedule;
};

export const remove = async (id) => {
  const schedule = await AutomationSchedule.findByPk(id);
  if (!schedule) return null;

  await schedule.destroy();
  
  // Reload scheduler setelah dihapus
  automationScheduler.reloadAll();
  
  return true;
};

export const removeAll = async () => {
  const deletedCount = await AutomationSchedule.destroy({ where: {} });
  
  // Reload scheduler setelah semua dihapus
  automationScheduler.reloadAll();
  
  return deletedCount;
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  removeAll
};