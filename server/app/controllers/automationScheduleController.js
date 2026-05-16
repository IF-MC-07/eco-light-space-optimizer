import * as automationScheduleService from '../services/automationScheduleService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await automationScheduleService.getAll();
    res.status(200).json({ success: true, data, message: 'Automation schedules retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await automationScheduleService.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Automation schedule not found' });
    }
    res.status(200).json({ success: true, data, message: 'Automation schedule retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    console.log('Creating Automation Schedule with body:', req.body);
    const data = await automationScheduleService.create(req.body);
    res.status(201).json({ success: true, data, message: 'Automation schedule created successfully' });
  } catch (error) {
    console.error('FAILED TO CREATE AUTOMATION SCHEDULE:', error);
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await automationScheduleService.update(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Automation schedule not found' });
    }
    res.status(200).json({ success: true, data, message: 'Automation schedule updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await automationScheduleService.remove(req.params.id);
    if (!isDeleted) {
      return res.status(404).json({ success: false, message: 'Automation schedule not found' });
    }
    res.status(200).json({ success: true, data: null, message: 'Automation schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};
