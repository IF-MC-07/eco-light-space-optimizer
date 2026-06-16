import responseFormatter from '../utils/response.js';
import * as lightControlService from '../services/lightControlService.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await lightControlService.getAll();
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await lightControlService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Light Control not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await lightControlService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await lightControlService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Light Control not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await lightControlService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Light Control not found' , 404);
    return responseFormatter.success(res, null, 'Light Control deleted successfully' );
  } catch (error) {
    next(error);
  }
};

export const toggle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await lightControlService.getById(id);
    if (!item) return responseFormatter.error(res, 'Light Control not found' , 404);
    
    const newStatus = item.light_status === 'on' ? 'off' : 'on';
    const data = await lightControlService.update(id, { 
      light_status: newStatus,
      updated_at: new Date()
    });
    
    return responseFormatter.success(res, data, `Light turned ${newStatus}`);
  } catch (error) {
    next(error);
  }
};
