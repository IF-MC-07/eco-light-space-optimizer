import { Router } from 'express';
import * as energyController from '../controllers/energy.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/summary', requireRole(['admin']), energyController.getSummary);
router.get('/logs', requireRole(['admin']), energyController.getLogs);
router.get('/breakdown', requireRole(['admin']), energyController.getBreakdown);

export default router;
