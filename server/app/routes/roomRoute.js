import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, roomController.getAll);
router.get('/:id', authenticate, roomController.getById);
router.post('/', authenticate, requireRole('admin'), roomController.create);
router.put('/:id', authenticate, requireRole('admin'), roomController.update);
router.delete('/:id', authenticate, requireRole('admin'), roomController.remove);

export default router;
