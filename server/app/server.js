import app from './app.js';
import db from './models/index.js';
import mqttService from './services/mqttService.js';
import { CronJob } from 'cron';
import * as emailService from './services/emailService.js';
import { Op } from 'sequelize';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');

    // Initialize MQTT Connection for detection pipeline
    mqttService.connect();

    // Daily Activity Digest Cron Job (runs at midnight)
    const digestJob = new CronJob('0 0 * * *', async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const activities = await db.ActivityLog.findAll({
          where: {
            timestamp: {
              [Op.gte]: yesterday
            }
          }
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

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();
