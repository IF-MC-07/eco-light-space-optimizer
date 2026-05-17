import { Router } from 'express';
import * as savingsController from '../controllers/savings.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/summary', requireRole(['admin']), savingsController.getSummary);
router.get('/breakdown', requireRole(['admin']), savingsController.getBreakdown);
router.get('/trend', requireRole(['admin']), savingsController.getTrend);
router.get('/yoy', requireRole(['admin']), savingsController.getYoY);

export default router;
