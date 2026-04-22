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

const router = Router();

router.use('/ruangan', ruanganRoute);
router.use('/pengguna', penggunaRoute);
router.use('/zona', zonaRoute);
router.use('/kamera', kameraRoute);
router.use('/perangkat-iot', perangkatIotRoute);
router.use('/sensor-daya', sensorDayaRoute);
router.use('/log-energi', logEnergiRoute);
router.use('/jadwal-otomatisasi', jadwalOtomatisasiRoute);
router.use('/log-deteksi', logDeteksiRoute);
router.use('/kontrol-lampu', kontrolLampuRoute);
router.use('/kontrol-ac', kontrolAcRoute);

export default router;
