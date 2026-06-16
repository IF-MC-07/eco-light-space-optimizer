import responseFormatter from '../utils/response.js';
import * as roomService from '../services/roomService.js';
import db from '../models/index.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await roomService.getAll();
    return responseFormatter.success(res, data, 'Rooms retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await roomService.getById(req.params.id);
    if (!data) {
      return responseFormatter.error(res, 'Room not found' , 404);
    }
    return responseFormatter.success(res, data, 'Room retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await roomService.create(req.body);
    return responseFormatter.success(res, data, 'Room created successfully' , 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await roomService.update(req.params.id, req.body);
    if (!data) {
      return responseFormatter.error(res, 'Room not found' , 404);
    }
    return responseFormatter.success(res, data, 'Room updated successfully' );
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await roomService.remove(req.params.id);
    if (!isDeleted) {
      return responseFormatter.error(res, 'Room not found' , 404);
    }
    return responseFormatter.success(res, null, 'Room deleted successfully' );
  } catch (error) {
    next(error);
  }
};

export const getZones = async (req, res, next) => {
  try {
    const data = await db.Zone.findAll({ where: { room_id: req.params.id } });
    return responseFormatter.success(res, data, 'Room zones retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const getDetections = async (req, res, next) => {
  try {
    const data = await db.DetectionLog.findAll({
      include: [{
        model: db.Zone,
        where: { room_id: req.params.id }
      }]
    });
    return responseFormatter.success(res, data, 'Room detections retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req, res, next) => {
  try {
    const data = await db.IotDevice.findAll({ where: { room_id: req.params.id } });
    return responseFormatter.success(res, data, 'Room devices retrieved successfully' );
  } catch (error) {
    next(error);
  }
};
