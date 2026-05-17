import { Router } from 'express';
import * as iotDeviceController from '../controllers/iotDeviceController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, iotDeviceController.getAll);
router.get('/:id', authenticate, iotDeviceController.getById);
router.post('/', authenticate, requireRole(['admin']), iotDeviceController.create);
router.put('/:id', authenticate, requireRole(['admin']), iotDeviceController.update);
router.delete('/:id', authenticate, requireRole(['admin']), iotDeviceController.remove);

export default router;
