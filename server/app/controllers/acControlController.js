import responseFormatter from '../utils/response.js';
import * as acControlService from '../services/acControlService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await acControlService.getAll();
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await acControlService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'AC Control not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await acControlService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await acControlService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'AC Control not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await acControlService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'AC Control not found' , 404);
    return responseFormatter.success(res, null, 'AC Control deleted successfully' );
  } catch (error) {
    next(error);
  }
};

export const toggle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { temperature_setting } = req.body;
    const item = await acControlService.getById(id);
    if (!item) return responseFormatter.error(res, 'AC Control not found' , 404);
    
    const newStatus = item.ac_status === 'on' ? 'off' : 'on';
    
    const payload = { ac_status: newStatus };
    if (temperature_setting) payload.temperature_setting = temperature_setting;

    const data = await acControlService.update(id, payload);
    
    return responseFormatter.success(res, data, `AC turned ${newStatus}`);
  } catch (error) {
    next(error);
  }
};
