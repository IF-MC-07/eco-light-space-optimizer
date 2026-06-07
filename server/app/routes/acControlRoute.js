import { Router } from 'express';
import * as acControlController from '../controllers/acControlController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin']), acControlController.getAll);
router.get('/:id', authenticate, requireRole(['admin']), acControlController.getById);
router.post('/', authenticate, requireRole(['admin']), acControlController.create);
router.put('/:id', authenticate, requireRole(['admin']), acControlController.update);
router.patch('/:id/toggle', authenticate, requireRole(['admin']), acControlController.toggle);
router.delete('/:id', authenticate, requireRole(['admin']), acControlController.remove);

export default router;
