import { Router } from 'express';
import * as automationScheduleController from '../controllers/automationScheduleController.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as roleMiddleware from '../middlewares/role.middleware.js';

const router = Router();

const authenticate = authMiddleware.authenticate || authMiddleware.default;
const requireRole = roleMiddleware.requireRole || roleMiddleware.default;

router.get('/', authenticate, automationScheduleController.getAll);
router.get('/stats', authenticate, automationScheduleController.getStats);
router.delete('/', authenticate, requireRole('admin'), automationScheduleController.removeAll);
router.get('/:id', authenticate, automationScheduleController.getById);
router.post('/', authenticate, requireRole('admin'), automationScheduleController.create);
router.put('/:id', authenticate, requireRole('admin'), automationScheduleController.update);
router.delete('/:id', authenticate, requireRole('admin'), automationScheduleController.remove);

export default router;