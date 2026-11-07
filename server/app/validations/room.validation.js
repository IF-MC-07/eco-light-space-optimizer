import Joi from 'joi';

const floorSchema = Joi.alternatives()
  .try(Joi.string().max(20), Joi.number())
  .custom((val, helpers) => {
    if (val === null || val === undefined || val === '') return val;
    const strVal = String(val);
    if (strVal.length > 20) {
      return helpers.error('string.max', { limit: 20 });
    }
    return strVal;
  })
  .optional()
  .allow(null, '');

export const createRoomSchema = Joi.object({
  room_id: Joi.string().max(30).optional().allow(null, ''),
  room_name: Joi.string().max(100).required().messages({
    'string.empty': 'Nama ruangan tidak boleh kosong',
    'any.required': 'Nama ruangan wajib diisi'
  }),
  location: Joi.string().max(100).optional().allow(null, ''),
  capacity: Joi.number().integer().min(1).optional().allow(null),
  building: Joi.string().max(100).optional().allow(null, ''),
  floor: floorSchema,
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional()
}).options({ stripUnknown: true });

export const updateRoomSchema = Joi.object({
  room_name: Joi.string().max(100).optional(),
  location: Joi.string().max(100).optional().allow(null, ''),
  capacity: Joi.number().integer().min(1).optional().allow(null),
  building: Joi.string().max(100).optional().allow(null, ''),
  floor: floorSchema,
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional()
}).options({ stripUnknown: true });
