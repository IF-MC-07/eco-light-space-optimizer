import { Router } from 'express';
import * as holidayController from '../controllers/holiday.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, holidayController.getAll);
router.get('/:id', authenticate, holidayController.getById);
router.post('/', authenticate, requireRole(['admin']), holidayController.create);
router.put('/:id', authenticate, requireRole(['admin']), holidayController.update);
router.delete('/:id', authenticate, requireRole(['admin']), holidayController.remove);

export default router;
