import Joi from 'joi';

const zonePayloadSchema = Joi.object({
  zone_id: Joi.number().optional().allow(null), // optional, absent or negative for new zones
  camera_id: Joi.number().required(),
  zone_name: Joi.string().max(100).required(),
  x1_pct: Joi.number().min(0).max(1).required(),
  y1_pct: Joi.number().min(0).max(1).required(),
  x2_pct: Joi.number().min(0).max(1).required(),
  y2_pct: Joi.number().min(0).max(1).required(),
  color: Joi.string().max(20).required(),
  sort_order: Joi.number().optional().allow(null)
});

export const saveZoneValidation = Joi.array().items(zonePayloadSchema).required();
