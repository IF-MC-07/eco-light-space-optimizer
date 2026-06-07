import { Router } from 'express';
import * as energyLogController from '../controllers/energyLogController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin']), energyLogController.getAll);
router.get('/:id', authenticate, requireRole(['admin']), energyLogController.getById);
router.post('/', authenticate, requireRole(['admin']), energyLogController.create);
router.put('/:id', authenticate, requireRole(['admin']), energyLogController.update);
router.delete('/:id', authenticate, requireRole(['admin']), energyLogController.remove);

export default router;
