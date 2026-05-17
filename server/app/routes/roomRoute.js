import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin', 'mahasiswa']), roomController.getAll);
router.get('/:id', authenticate, requireRole(['admin', 'mahasiswa']), roomController.getById);
router.post('/', authenticate, requireRole(['admin']), roomController.create);
router.put('/:id', authenticate, requireRole(['admin']), roomController.update);
router.delete('/:id', authenticate, requireRole(['admin']), roomController.remove);

router.get('/:id/zones', authenticate, requireRole(['admin', 'mahasiswa']), roomController.getZones);
router.get('/:id/detection', authenticate, requireRole(['admin', 'mahasiswa']), roomController.getDetections);
router.get('/:id/devices', authenticate, requireRole(['admin']), roomController.getDevices);

export default router;
