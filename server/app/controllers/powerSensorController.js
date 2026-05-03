import * as powerSensorService from '../services/powerSensorService.js';

export const getAll = async (req, res) => {
  try {
    const data = await powerSensorService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await powerSensorService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await powerSensorService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await powerSensorService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await powerSensorService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, message: 'Sensor Daya deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
