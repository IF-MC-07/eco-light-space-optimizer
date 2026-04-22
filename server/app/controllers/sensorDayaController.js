import * as sensorDayaService from '../services/sensorDayaService.js';

export const getAll = async (req, res) => {
  try {
    const data = await sensorDayaService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await sensorDayaService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await sensorDayaService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await sensorDayaService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await sensorDayaService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Sensor Daya not found' });
    res.status(200).json({ success: true, message: 'Sensor Daya deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
