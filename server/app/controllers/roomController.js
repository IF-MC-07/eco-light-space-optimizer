import * as roomService from '../services/roomService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await roomService.getAll();
    res.status(200).json({ success: true, data, message: 'Rooms retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await roomService.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data, message: 'Room retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    console.log('Creating Room with body:', req.body);
    const data = await roomService.create(req.body);
    res.status(201).json({ success: true, data, message: 'Room created successfully' });
  } catch (error) {
    console.error('FAILED TO CREATE ROOM:', error);
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await roomService.update(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data, message: 'Room updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await roomService.remove(req.params.id);
    if (!isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data: null, message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};
