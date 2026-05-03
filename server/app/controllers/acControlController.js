import * as acControlService from '../services/acControlService.js';

export const getAll = async (req, res) => {
  try {
    const data = await acControlService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await acControlService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'AC Control not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await acControlService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await acControlService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'AC Control not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await acControlService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'AC Control not found' });
    res.status(200).json({ success: true, message: 'AC Control deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { temperature_setting } = req.body;
    const item = await acControlService.getById(id);
    if (!item) return res.status(404).json({ success: false, message: 'AC Control not found' });
    
    const newStatus = item.ac_status === 'on' ? 'off' : 'on';
    
    const payload = { ac_status: newStatus };
    if (temperature_setting) payload.temperature_setting = temperature_setting;

    const data = await acControlService.update(id, payload);
    
    res.status(200).json({ success: true, message: `AC turned ${newStatus}`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
