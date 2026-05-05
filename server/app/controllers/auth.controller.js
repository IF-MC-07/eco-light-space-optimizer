import * as authService from '../services/auth.service.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validations/auth.validation.js';

export const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const user = await authService.register(value);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  } catch (error) {
    if (error.message === 'Email already exists.') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const data = await authService.login(value.email, value.password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (error) {
    if (error.message === 'Email or password is wrong.') {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.user_id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await authService.forgotPassword(value.email);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Email not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ success: false, message: 'User ID not found in query params.' });
    }

    const result = await authService.resetPassword(id, value.token, value.password);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Invalid token or expired.' || error.message === 'Invalid user.') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
