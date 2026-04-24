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
router.use('/ruangan', authenticate, ruanganRoute);
router.use('/pengguna', authenticate, requireRole('admin'), penggunaRoute); // Users should probably be managed by admin
router.use('/zona', authenticate, zonaRoute);
router.use('/kamera', authenticate, kameraRoute);
router.use('/perangkat-iot', authenticate, perangkatIotRoute);
router.use('/sensor-daya', authenticate, sensorDayaRoute);
router.use('/log-energi', authenticate, logEnergiRoute);
router.use('/jadwal-otomatisasi', authenticate, requireRole('admin'), jadwalOtomatisasiRoute);
router.use('/log-deteksi', authenticate, logDeteksiRoute);
router.use('/kontrol-lampu', authenticate, requireRole('admin'), kontrolLampuRoute);
router.use('/kontrol-ac', authenticate, requireRole('admin'), kontrolAcRoute);


export default router;
