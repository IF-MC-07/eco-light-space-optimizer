import { Router } from 'express';
import * as cameraController from '../controllers/cameraController.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', requireRole(['admin']), cameraController.getAll);
router.get('/:id', cameraController.getById);
router.post('/', cameraController.create);
router.put('/:id', cameraController.update);
router.delete('/:id', cameraController.remove);

export default router;
