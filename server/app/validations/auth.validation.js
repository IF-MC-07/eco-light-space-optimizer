import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Nama tidak boleh kosong',
    'string.min': 'Nama minimal 3 karakter',
    'any.required': 'Nama wajib diisi'
  }),
  username: Joi.string().min(3).required().messages({
    'string.empty': 'Username tidak boleh kosong',
    'string.min': 'Username minimal 3 karakter',
    'any.required': 'Username wajib diisi'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email tidak boleh kosong',
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Kata sandi tidak boleh kosong',
    'string.min': 'Kata sandi minimal 6 karakter',
    'any.required': 'Kata sandi wajib diisi'
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email tidak boleh kosong',
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Kata sandi tidak boleh kosong',
    'any.required': 'Kata sandi wajib diisi'
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email tidak boleh kosong',
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Token tidak boleh kosong',
    'any.required': 'Token wajib diisi'
  }),
  password: Joi.string().min(6).messages({
    'string.empty': 'Kata sandi baru tidak boleh kosong',
    'string.min': 'Kata sandi baru minimal 6 karakter'
  }),
  newPassword: Joi.string().min(6).messages({
    'string.empty': 'Kata sandi baru tidak boleh kosong',
    'string.min': 'Kata sandi baru minimal 6 karakter'
  }),
}).or('password', 'newPassword').messages({
  'object.missing': 'Kata sandi baru wajib diisi'
});
