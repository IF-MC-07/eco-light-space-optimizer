import responseFormatter from '../utils/response.js';
import * as userService from '../services/userService.js';

export const getAll = async (req, res, next) => {
  try {
    const result = await userService.getAll(req.query);
    if (result && result.users && result.pagination) {
      return responseFormatter.success(res, { users: result.users, pagination: result.pagination }, 'Users retrieved successfully' 
      );
    } else {
      return responseFormatter.success(res, result, 'Users retrieved successfully' );
    }
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await userService.getById(req.params.id);
    if (!data) {
      return responseFormatter.error(res, 'User not found' , 404);
    }
    return responseFormatter.success(res, data, 'User retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await userService.create(req.body);
    return responseFormatter.success(res, data, 'User created successfully' , 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await userService.update(req.params.id, req.body);
    if (!data) {
      return responseFormatter.error(res, 'User not found' , 404);
    }
    return responseFormatter.success(res, data, 'User updated successfully' );
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await userService.remove(req.params.id);
    if (!isDeleted) {
      return responseFormatter.error(res, 'User not found' , 404);
    }
    return responseFormatter.success(res, null, 'User deleted successfully' );
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const data = await userService.getStats();
    return responseFormatter.success(res, data, 'User stats retrieved successfully' );
  } catch (error) {
    next(error);
  }
};
 