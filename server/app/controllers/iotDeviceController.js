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
    res.status(200).json({ success: true, data, message: 'IoT devices retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await iotDeviceService.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'IoT device not found' });
    }
    res.status(200).json({ success: true, data, message: 'IoT device retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await iotDeviceService.create(req.body);
    res.status(201).json({ success: true, data, message: 'IoT device created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await iotDeviceService.update(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: 'IoT device not found' });
    }
    res.status(200).json({ success: true, data, message: 'IoT device updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await iotDeviceService.remove(req.params.id);
    if (!isDeleted) {
      return res.status(404).json({ success: false, message: 'IoT device not found' });
    }
    res.status(200).json({ success: true, data: null, message: 'IoT device deleted successfully' });
  } catch (error) {
    next(error);
  }
};
