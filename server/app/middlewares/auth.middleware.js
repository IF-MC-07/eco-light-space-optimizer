import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { Pengguna } = db;

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Pengguna.findByPk(decoded.id_pengguna);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak valid.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token kadaluarsa.' });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
};
