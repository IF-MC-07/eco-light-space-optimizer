import { Router } from 'express';
import * as detectionLogController from '../controllers/detectionLogController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, detectionLogController.getAll);
router.get('/:id', authenticate, detectionLogController.getById);
router.post('/', authenticate, detectionLogController.create);
router.put('/:id', authenticate, detectionLogController.update);
router.delete('/:id', authenticate, detectionLogController.remove);

export default router;
