import db from '../models/index.js';

const { ActivityLog } = db;

export const activityLogger = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Only log successful mutations (POST, PUT, DELETE) on /api routes
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && 
        res.statusCode >= 200 && 
        res.statusCode < 300 && 
        req.originalUrl.startsWith('/api')) {
      
      const user_id = req.user ? req.user.user_id : null;
      const action = `${req.method} ${req.originalUrl}`;
      const details = JSON.stringify({
        body: req.body,
        params: req.params,
        query: req.query,
        response: data
      });

      ActivityLog.create({
        user_id,
        action,
        details,
        timestamp: new Date()
      }).catch(err => console.error('Failed to log activity:', err));
    }
    
    return originalJson.call(this, data);
  };

  next();
};
