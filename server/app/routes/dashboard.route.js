import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', authenticate, dashboardController.getSummary);
router.get('/stats', authenticate, requireRole(['admin', 'mahasiswa']), dashboardController.getStats);

export default router;
