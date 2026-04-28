import Joi from 'joi';

const zonaPayloadSchema = Joi.object({
  id_zona: Joi.number().optional().allow(null), // optional, absent or negative for new zones
  id_kamera: Joi.number().required(),
  nama_zona: Joi.string().max(100).required(),
  x1_pct: Joi.number().min(0).max(1).required(),
  y1_pct: Joi.number().min(0).max(1).required(),
  x2_pct: Joi.number().min(0).max(1).required(),
  y2_pct: Joi.number().min(0).max(1).required(),
  warna: Joi.string().max(20).required(),
  urutan: Joi.number().optional().allow(null)
});

export const simpanZonaValidation = Joi.array().items(zonaPayloadSchema).required();
