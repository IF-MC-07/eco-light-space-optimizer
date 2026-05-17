import { Router } from 'express';
import * as exportController from '../controllers/exportController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Export routes are admin only

router.get('/users', authenticate, requireRole(['admin']), exportController.exportUsers);

router.get('/energy-logs', authenticate, requireRole(['admin']), exportController.exportEnergyLogs);
router.get('/savings-report', authenticate, requireRole(['admin']), exportController.exportSavingsReport);

router.get('/:resource/:format', authenticate, requireRole(['admin']), exportController.exportGeneric);

export default router;
