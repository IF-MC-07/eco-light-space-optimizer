import * as kontrolLampuService from '../services/kontrolLampuService.js';

export const getAll = async (req, res) => {
  try {
    const data = await kontrolLampuService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await kontrolLampuService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Kontrol Lampu not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await kontrolLampuService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await kontrolLampuService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Kontrol Lampu not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await kontrolLampuService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Kontrol Lampu not found' });
    res.status(200).json({ success: true, message: 'Kontrol Lampu deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
