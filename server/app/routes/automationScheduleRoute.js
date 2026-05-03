import { Router } from 'express';
import * as automationScheduleController from '../controllers/automationScheduleController.js';

const router = Router();

router.get('/', automationScheduleController.getAll);
router.get('/:id', automationScheduleController.getById);
router.post('/', automationScheduleController.create);
router.put('/:id', automationScheduleController.update);
router.delete('/:id', automationScheduleController.remove);

export default router;
