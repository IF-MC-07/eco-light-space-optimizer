import responseFormatter from '../utils/response.js';
import * as iotDeviceService from '../services/iotDeviceService.js';

export const getAll = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    let data;
    if (room_id) {
      data = await iotDeviceService.getByRoomId(room_id);
    } else {
      data = await iotDeviceService.getAll();
    }
    return responseFormatter.success(res, data, 'IoT devices retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await iotDeviceService.getById(req.params.id);
    if (!data) {
      return responseFormatter.error(res, 'IoT device not found' , 404);
    }
    return responseFormatter.success(res, data, 'IoT device retrieved successfully' );
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await iotDeviceService.create(req.body);
    return responseFormatter.success(res, data, 'IoT device created successfully' , 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await iotDeviceService.update(req.params.id, req.body);
    if (!data) {
      return responseFormatter.error(res, 'IoT device not found' , 404);
    }
    return responseFormatter.success(res, data, 'IoT device updated successfully' );
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await iotDeviceService.remove(req.params.id);
    if (!isDeleted) {
      return responseFormatter.error(res, 'IoT device not found' , 404);
    }
    return responseFormatter.success(res, null, 'IoT device deleted successfully' );
  } catch (error) {
    next(error);
  }
};
