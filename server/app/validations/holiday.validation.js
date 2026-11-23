import Joi from 'joi';

export const createHolidaySchema = Joi.object({
  holiday_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Format holiday_date harus YYYY-MM-DD',
      'any.required': 'holiday_date wajib diisi'
    }),
  name: Joi.string().max(255).required().messages({
    'string.empty': 'Nama libur tidak boleh kosong',
    'any.required': 'Nama libur wajib diisi'
  }),
  type: Joi.string()
    .valid('nasional', 'cuti_bersama', 'kampus')
    .required()
    .messages({
      'any.only': 'type harus salah satu dari nasional, cuti_bersama, atau kampus',
      'any.required': 'type wajib diisi'
    }),
  suspend_rules: Joi.boolean().default(true),
  source_ref: Joi.string().allow(null, '').optional()
}).options({ stripUnknown: true });

export const updateHolidaySchema = Joi.object({
  holiday_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  name: Joi.string().max(255).optional(),
  type: Joi.string().valid('nasional', 'cuti_bersama', 'kampus').optional(),
  suspend_rules: Joi.boolean().optional(),
  source_ref: Joi.string().allow(null, '').optional()
}).min(1).options({ stripUnknown: true });
