import { Router } from 'express';
import * as savingsController from '../controllers/savings.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', authenticate, requireRole(['admin']), savingsController.getSummary);
router.get('/breakdown', authenticate, requireRole(['admin']), savingsController.getBreakdown);
router.get('/trend', authenticate, requireRole(['admin']), savingsController.getTrend);
router.get('/yoy', authenticate, requireRole(['admin']), savingsController.getYoY);

export default router;
