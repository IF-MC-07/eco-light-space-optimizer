import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring.controller.js';

const router = Router();

router.get('/energi', monitoringController.getEnergi);
router.get('/sensor', monitoringController.getSensor);

export default router;
