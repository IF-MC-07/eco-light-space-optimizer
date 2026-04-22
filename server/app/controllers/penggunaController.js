import * as penggunaService from '../services/penggunaService.js';

export const getAll = async (req, res) => {
  try {
    const data = await penggunaService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await penggunaService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Pengguna not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await penggunaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await penggunaService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Pengguna not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await penggunaService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Pengguna not found' });
    res.status(200).json({ success: true, message: 'Pengguna deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
