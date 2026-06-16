import { Router } from 'express';
import * as energyController from '../controllers/energy.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', authenticate, requireRole(['admin']), energyController.getSummary);
router.get('/logs', authenticate, requireRole(['admin']), energyController.getLogs);
router.get('/breakdown', authenticate, requireRole(['admin']), energyController.getBreakdown);

export default router;
