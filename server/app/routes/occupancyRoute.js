import { Router } from 'express';
import * as occupancyController from '../controllers/occupancyController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin', 'mahasiswa']), occupancyController.getAll);
router.get('/:id', authenticate, requireRole(['admin', 'mahasiswa']), occupancyController.getById);

export default router;

