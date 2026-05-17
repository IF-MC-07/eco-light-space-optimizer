import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/summary', dashboardController.getSummary);
router.get('/stats', requireRole(['admin', 'mahasiswa']), dashboardController.getStats);

export default router;
