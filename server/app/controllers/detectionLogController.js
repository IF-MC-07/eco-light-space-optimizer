import responseFormatter from '../utils/response.js';
import * as detectionLogService from '../services/detectionLogService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await detectionLogService.getAll();
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await detectionLogService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Log Deteksi not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await detectionLogService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await detectionLogService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Log Deteksi not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await detectionLogService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Log Deteksi not found' , 404);
    return responseFormatter.success(res, null, 'Log Deteksi deleted successfully' );
  } catch (error) {
    next(error);
  }
};
