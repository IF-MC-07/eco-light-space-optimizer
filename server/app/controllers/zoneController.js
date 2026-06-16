import * as zoneService from '../services/zoneService.js';
import { saveZoneValidation } from '../validations/zone.validation.js';
import db from '../models/index.js';
import mqttService from '../services/mqttService.js';
import responseFormatter from '../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await zoneService.getAll();
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await zoneService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Zone not found', 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getByCamera = async (req, res, next) => {
  try {
    const data = await zoneService.getZoneByCamera(req.params.cameraId);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const simpan = async (req, res, next) => {
  try {
    const { error, value } = saveZoneValidation.validate(req.body);
    if (error) {
      console.error('[Zone Validation Error]:', error.details);
      return responseFormatter.error(res, error.details[0].message, 400);
    }

    await zoneService.upsertZone(value);
    mqttService.publish('ai/zone/reload', { action: 'upsert' });
    return responseFormatter.success(res, null, 'Zones saved successfully');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await zoneService.create(req.body);
    mqttService.publish('ai/zone/reload', { action: 'create' });
    return responseFormatter.success(res, data, 'Success', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await zoneService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Zone not found', 404);
    mqttService.publish('ai/zone/reload', { action: 'update' });
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const deleteZone = async (req, res, next) => {
  try {
    const isDeleted = await zoneService.deleteZone(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Zone not found', 404);
    mqttService.publish('ai/zone/reload', { action: 'delete', zone_id: req.params.id });
    return responseFormatter.success(res, null, 'Zone deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const zone = await db.Zone.findByPk(id, {
      include: [
        { model: db.Room }
      ]
    });
    
    if (!zone) return responseFormatter.error(res, 'Zone not found', 404);

    // get latest detection log
    const detection_log = await db.DetectionLog.findOne({
      where: { zone_id: id },
      order: [['detection_time', 'DESC']]
    });

    // get light controls
    const light_controls = await db.LightControl.findAll({
      include: [
        { 
          model: db.IotDevice, 
        }
      ],
      where: { zone_id: id }
    });

    return responseFormatter.success(res, {
      ...zone.toJSON(),
      detection_log,
      light_controls
    }, 'Success');
  } catch (error) {
    next(error);
  }
};
