import { Router } from 'express';
import * as automationScheduleController from '../controllers/automationScheduleController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, automationScheduleController.getAll);
router.get('/:id', authenticate, automationScheduleController.getById);
router.post('/', authenticate, requireRole('admin'), automationScheduleController.create);
router.put('/:id', authenticate, requireRole('admin'), automationScheduleController.update);
router.delete('/:id', authenticate, requireRole('admin'), automationScheduleController.remove);

export default router;
