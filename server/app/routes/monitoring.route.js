import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/energi', monitoringController.getEnergi);
router.get('/sensor', monitoringController.getSensor);

router.get('/stats', requireRole(['admin', 'mahasiswa']), monitoringController.getStats);
router.get('/devices', requireRole(['admin', 'mahasiswa']), monitoringController.getDevices);
router.put('/devices/:id', requireRole(['admin']), monitoringController.updateDevice);
router.post('/master-control', requireRole(['admin']), monitoringController.postMasterControl);
router.get('/climate', requireRole(['admin']), monitoringController.getClimate);
router.put('/climate', requireRole(['admin']), monitoringController.updateClimate);

export default router;
