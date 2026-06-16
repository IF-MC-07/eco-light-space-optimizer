import responseFormatter from '../utils/response.js';
import * as powerSensorService from '../services/powerSensorService.js';
import db from '../models/index.js';

export const getAll = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    let data;
    if (room_id) {
      data = await db.PowerSensor.findAll({
        where: { room_id },
        order: [['read_at', 'DESC']]
      });
    } else {
      data = await powerSensorService.getAll();
    }
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await powerSensorService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Sensor Daya not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await powerSensorService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await powerSensorService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Sensor Daya not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await powerSensorService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Sensor Daya not found' , 404);
    return responseFormatter.success(res, null, 'Sensor Daya deleted successfully' );
  } catch (error) {
    next(error);
  }
};
