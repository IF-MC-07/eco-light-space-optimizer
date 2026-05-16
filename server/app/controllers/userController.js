import * as userService from '../services/userService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await userService.getAll();
    res.status(200).json({ success: true, data, message: 'Users retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await userService.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data, message: 'User retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await userService.create(req.body);
    res.status(201).json({ success: true, data, message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await userService.update(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await userService.remove(req.params.id);
    if (!isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: null, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
