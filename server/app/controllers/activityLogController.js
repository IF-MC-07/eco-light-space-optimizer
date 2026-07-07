import responseFormatter from '../utils/response.js';
import db from '../models/index.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await db.ActivityLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 50,
      include: [{ model: db.User, attributes: ['name', 'username'] }]
    });
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};
