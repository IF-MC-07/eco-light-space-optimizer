import { Router } from 'express';
import * as powerSensorController from '../controllers/powerSensorController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin']), powerSensorController.getAll);
router.get('/:id', authenticate, requireRole(['admin']), powerSensorController.getById);
router.post('/', authenticate, requireRole(['admin']), powerSensorController.create);
router.put('/:id', authenticate, requireRole(['admin']), powerSensorController.update);
router.delete('/:id', authenticate, requireRole(['admin']), powerSensorController.remove);

export default router;
