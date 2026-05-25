import * as zoneService from '../services/zoneService.js';
import { saveZoneValidation } from '../validations/zone.validation.js';
import db from '../models/index.js';
import mqttService from '../services/mqttService.js';

export const getAll = async (req, res) => {
  try {
    const data = await zoneService.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await zoneService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByCamera = async (req, res) => {
  try {
    const data = await zoneService.getZoneByCamera(req.params.cameraId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const simpan = async (req, res) => {
  try {
    const { error, value } = saveZoneValidation.validate(req.body);
    if (error) {
      console.error('[Zone Validation Error]:', error.details);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    await zoneService.upsertZone(value);
    mqttService.publish('ai/zone/reload', { action: 'upsert' });
    res.status(200).json({ success: true, message: 'Zones saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await zoneService.create(req.body);
    mqttService.publish('ai/zone/reload', { action: 'create' });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await zoneService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Zone not found' });
    mqttService.publish('ai/zone/reload', { action: 'update' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteZone = async (req, res) => {
  try {
    const isDeleted = await zoneService.deleteZone(req.params.id);
    if (!isDeleted) return res.status(404).json({ success: false, message: 'Zone not found' });
    mqttService.publish('ai/zone/reload', { action: 'delete', zone_id: req.params.id });
    res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await db.Zone.findByPk(id, {
      include: [
        { model: db.Room }
      ]
    });
    
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

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

    res.status(200).json({
      success: true,
      data: {
        ...zone.toJSON(),
        detection_log,
        light_controls
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
