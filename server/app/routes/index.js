import { Router } from 'express';

import roomRoute from './roomRoute.js';
import userRoute from './userRoute.js';
import zoneRoute from './zoneRoute.js';
import cameraRoute from './cameraRoute.js';
import iotDeviceRoute from './iotDeviceRoute.js';
import powerSensorRoute from './powerSensorRoute.js';
import energyLogRoute from './energyLogRoute.js';
import automationScheduleRoute from './automationScheduleRoute.js';
import detectionLogRoute from './detectionLogRoute.js';
import lightControlRoute from './lightControlRoute.js';
import acControlRoute from './acControlRoute.js';
import authRoute from './auth.route.js';
import dashboardRoute from './dashboard.route.js';
import monitoringRoute from './monitoring.route.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use('/auth', authRoute);
router.use('/dashboard', authenticate, dashboardRoute);
router.use('/monitoring', authenticate, monitoringRoute);
router.use('/rooms', authenticate, roomRoute);
router.use('/users', authenticate, requireRole('admin'), userRoute);
router.use('/zones', authenticate, zoneRoute);
router.use('/cameras', authenticate, cameraRoute);
router.use('/iot-devices', authenticate, iotDeviceRoute);
router.use('/power-sensors', authenticate, powerSensorRoute);
router.use('/energy-logs', authenticate, energyLogRoute);
router.use('/automation-schedules', authenticate, requireRole('admin'), automationScheduleRoute);
router.use('/detection-logs', authenticate, detectionLogRoute);
router.use('/light-controls', authenticate, requireRole('admin'), lightControlRoute);
router.use('/ac-controls', authenticate, requireRole('admin'), acControlRoute);

export default router;
