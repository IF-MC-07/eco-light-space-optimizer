import db from '../models/index.js';

const { JadwalOtomatisasi } = db;

export const getAll = async () => {
  return await JadwalOtomatisasi.findAll();
};

export const getById = async (id) => {
  return await JadwalOtomatisasi.findByPk(id);
};

export const create = async (data) => {
  return await JadwalOtomatisasi.create(data);
};

export const update = async (id, data) => {
  const jadwal = await JadwalOtomatisasi.findByPk(id);
  if (!jadwal) return null;
  return await jadwal.update(data);
};

export const remove = async (id) => {
  const jadwal = await JadwalOtomatisasi.findByPk(id);
  if (!jadwal) return null;
  await jadwal.destroy();
  return true;
};
