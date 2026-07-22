import fs from 'fs';
import https from 'https';
import http from 'http';
import { CronJob } from 'cron';
import { Op } from 'sequelize';

import app from './app.js';
import db from './models/index.js';
import mqttService from './services/mqttService.js';
import automationScheduler from './services/automationScheduler.js';
import * as emailService from './services/emailService.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.sync();
    console.log('Database synchronized successfully.');

    mqttService.connect();

    await automationScheduler.start();
    console.log('[Scheduler] Automation scheduler started successfully.');

    const digestJob = new CronJob('0 0 * * *', async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const activities = await db.ActivityLog.findAll({
          where: {
            timestamp: {
              [Op.gte]: yesterday,
            },
          },
        });

        if (activities.length > 0) {
          const admins = await db.User.findAll({ where: { role: 'admin' } });
          if (admins.length > 0) {
            await emailService.sendDailyDigest(admins, activities);
            console.log(`Daily digest sent to ${admins.length} admins.`);
          }
        }
      } catch (error) {
        console.error('Failed to send daily digest:', error);
      }
    });

    digestJob.start();

    const cleanupJob = new CronJob('0 1 * * *', async () => {
      try {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        await db.ActivityLog.destroy({
          where: {
            timestamp: {
              [Op.lt]: cutoff,
            },
          },
        });
        console.log('Old activity logs cleaned up successfully.');
      } catch (error) {
        console.error('Failed to cleanup activity logs:', error);
      }
    });

    cleanupJob.start();

    if (process.env.NODE_ENV === 'development') {
      const certPath = './certs/localhost.pem';
      const keyPath = './certs/localhost-key.pem';

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };

        https.createServer(httpsOptions, app).listen(PORT, () => {
          console.log(`HTTPS Server is running on port ${PORT} in development mode.`);
        });
      } else {
        console.warn('⚠️ Certificates not found. Fallback to HTTP.');
        http.createServer(app).listen(PORT, () => {
          console.log(`HTTP Server is running on port ${PORT} in development mode.`);
        });
      }
    } else {
      http.createServer(app).listen(PORT, () => {
        console.log(`HTTP Server is running on port ${PORT} in production mode.`);
      });
    }
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();