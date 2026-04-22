import * as perangkatIotService from '../services/perangkatIotService.js';

export const getAll = async (req, res) => {
  try {
    const data = await perangkatIotService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await perangkatIotService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Perangkat IoT not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await perangkatIotService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await perangkatIotService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Perangkat IoT not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await perangkatIotService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Perangkat IoT not found' });
    res.status(200).json({ success: true, message: 'Perangkat IoT deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
