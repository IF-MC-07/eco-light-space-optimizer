import Joi from 'joi';

const zonePayloadSchema = Joi.object({
  zone_id: Joi.string().optional().allow(null, ''),
  camera_id: Joi.string().required(),
  room_id: Joi.string().optional().allow(null, ''),
  zone_name: Joi.string().max(100).required(),
  zone_status: Joi.string().optional().allow(null, ''),
  x1_pct: Joi.number().min(0).max(1).required(),
  y1_pct: Joi.number().min(0).max(1).required(),
  x2_pct: Joi.number().min(0).max(1).required(),
  y2_pct: Joi.number().min(0).max(1).required(),
  skew_x: Joi.number().optional().allow(null),
  skew_y: Joi.number().optional().allow(null),
  color: Joi.string().max(20).required(),
  sort_order: Joi.number().optional().allow(null)
}).unknown(true);

export const saveZoneValidation = Joi.array().items(zonePayloadSchema).required();
