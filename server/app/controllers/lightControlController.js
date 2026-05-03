import * as lightControlService from '../services/lightControlService.js';

export const getAll = async (req, res) => {
  try {
    const data = await lightControlService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await lightControlService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Light Control not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await lightControlService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await lightControlService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Light Control not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const isDeleted = await lightControlService.remove(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Light Control not found' });
    res.status(200).json({ success: true, message: 'Light Control deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await lightControlService.getById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Light Control not found' });
    
    const newStatus = item.light_status === 'on' ? 'off' : 'on';
    const data = await lightControlService.update(id, { 
      light_status: newStatus,
      updated_at: new Date()
    });
    
    res.status(200).json({ success: true, message: `Light turned ${newStatus}`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
