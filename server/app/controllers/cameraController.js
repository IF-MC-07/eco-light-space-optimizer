import responseFormatter from '../utils/response.js';
import * as cameraService from '../services/cameraService.js';

export const getAll = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    const data = await cameraService.getAll(room_id);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await cameraService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await cameraService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await cameraService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await cameraService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, null, 'Camera deleted successfully' );
  } catch (error) {
    next(error);
  }
};
