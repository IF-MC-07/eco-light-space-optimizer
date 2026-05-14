import app from './app.js';
import db from './models/index.js';
import mqttService from './services/mqttService.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');

    // Initialize MQTT Connection for detection pipeline
    mqttService.connect();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();
