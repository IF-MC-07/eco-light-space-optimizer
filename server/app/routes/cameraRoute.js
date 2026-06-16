import { Router } from 'express';
import * as cameraController from '../controllers/cameraController.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/ai/stream-urls', cameraController.getAiStreamUrls);
router.get('/', authenticate, requireRole(['admin']), cameraController.getAll);
router.get('/:id', authenticate, cameraController.getById);
router.post('/', authenticate, cameraController.create);
router.put('/:id', authenticate, cameraController.update);
router.delete('/:id', authenticate, cameraController.remove);

export default router;
