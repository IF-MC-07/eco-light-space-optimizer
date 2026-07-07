import "./app/services/mqttEnergyService.js";
import fs from "fs";
import https from "https";
import http from "http";
import app from "./app.js";
import db from "./models/index.js";
import mqttService from "./services/mqttService.js";
import { CronJob } from "cron";
import * as emailService from "./services/emailService.js";
import { Op } from "sequelize";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.sync();
    console.log("Database synchronized successfully.");

    // Initialize MQTT Connection for detection pipeline
    mqttService.connect();

    // Daily Activity Digest Cron Job (runs at midnight)
    const digestJob = new CronJob("0 0 * * *", async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const activities = await db.ActivityLog.findAll({
          where: {
            timestamp: {
              [Op.gte]: yesterday,
            },
          },
        });

        if (activities.length > 0) {
          const admins = await db.User.findAll({ where: { role: "admin" } });
          if (admins.length > 0) {
            await emailService.sendDailyDigest(admins, activities);
            console.log(`Daily digest sent to ${admins.length} admins.`);
          }
        }
        cron.schedule("0 1 * * *", async () => {
          const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          await ActivityLog.destroy({
            where: { timestamp: { [Op.lt]: cutoff } },
          });
        });
      } catch (error) {
        console.error("Failed to send daily digest:", error);
      }
    });
    digestJob.start();

    if (process.env.NODE_ENV === "development") {
      // Development: Gunakan HTTPS dengan self-signed certificate (mkcert)
      const certPath = "./certs/localhost.pem";
      const keyPath = "./certs/localhost-key.pem";

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        https.createServer(httpsOptions, app).listen(PORT, () => {
          console.log(
            `HTTPS Server is running on port ${PORT} in development mode.`,
          );
        });
      } else {
        console.warn(
          "⚠️ Certificates not found. Fallback to HTTP. Run mkcert to generate them.",
        );
        http.createServer(app).listen(PORT, () => {
          console.log(
            `HTTP Server is running on port ${PORT} in development mode.`,
          );
        });
      }
    } else {
      // Production: Gunakan HTTP biasa, HTTPS di-handle oleh Nginx (Reverse Proxy)
      http.createServer(app).listen(PORT, () => {
        console.log(
          `HTTP Server is running on port ${PORT} in production mode.`,
        );
      });
    }
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

startServer();
