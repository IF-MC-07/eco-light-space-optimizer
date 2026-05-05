import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { User } = db;

export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user.',
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
