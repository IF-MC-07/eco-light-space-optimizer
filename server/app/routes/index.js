import { Router } from 'express';

import ruanganRoute from './ruanganRoute.js';
import penggunaRoute from './penggunaRoute.js';
import zonaRoute from './zonaRoute.js';
import kameraRoute from './kameraRoute.js';
import perangkatIotRoute from './perangkatIotRoute.js';
import sensorDayaRoute from './sensorDayaRoute.js';
import logEnergiRoute from './logEnergiRoute.js';
import jadwalOtomatisasiRoute from './jadwalOtomatisasiRoute.js';
import logDeteksiRoute from './logDeteksiRoute.js';
import kontrolLampuRoute from './kontrolLampuRoute.js';
import kontrolAcRoute from './kontrolAcRoute.js';
import authRoute from './auth.route.js';
import dashboardRoute from './dashboard.route.js';
import monitoringRoute from './monitoring.route.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use('/auth', authRoute);
router.use('/dashboard', authenticate, dashboardRoute);
router.use('/monitoring', authenticate, monitoringRoute);
router.use('/rooms', authenticate, ruanganRoute);
router.use('/users', authenticate, requireRole('admin'), penggunaRoute);
router.use('/zones', authenticate, zonaRoute);
router.use('/cameras', authenticate, kameraRoute);
router.use('/iot-devices', authenticate, perangkatIotRoute);
router.use('/power-sensors', authenticate, sensorDayaRoute);
router.use('/energy-logs', authenticate, logEnergiRoute);
router.use('/automation-schedules', authenticate, requireRole('admin'), jadwalOtomatisasiRoute);
router.use('/detection-logs', authenticate, logDeteksiRoute);
router.use('/light-controls', authenticate, requireRole('admin'), kontrolLampuRoute);
router.use('/ac-controls', authenticate, requireRole('admin'), kontrolAcRoute);

export default router;
