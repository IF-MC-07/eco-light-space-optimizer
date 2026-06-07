import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/energi', authenticate, monitoringController.getEnergi);
router.get('/sensor', authenticate, monitoringController.getSensor);

router.get('/stats', authenticate, requireRole(['admin', 'mahasiswa']), monitoringController.getStats);
router.get('/devices', authenticate, requireRole(['admin', 'mahasiswa']), monitoringController.getDevices);
router.put('/devices/:id', authenticate, requireRole(['admin']), monitoringController.updateDevice);
router.post('/master-control', authenticate, requireRole(['admin']), monitoringController.postMasterControl);
router.get('/climate', authenticate, requireRole(['admin']), monitoringController.getClimate);
router.put('/climate', authenticate, requireRole(['admin']), monitoringController.updateClimate);

export default router;
