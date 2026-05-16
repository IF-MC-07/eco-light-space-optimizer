import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Admin only routes for User CRUD
router.get('/', authenticate, requireRole('admin'), userController.getAll);
router.get('/:id', authenticate, requireRole('admin'), userController.getById);
router.post('/', authenticate, requireRole('admin'), userController.create);
router.put('/:id', authenticate, requireRole('admin'), userController.update);
router.delete('/:id', authenticate, requireRole('admin'), userController.remove);

export default router;
