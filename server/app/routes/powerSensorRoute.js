import { Router } from 'express';
import * as powerSensorController from '../controllers/powerSensorController.js';

const router = Router();

router.get('/', powerSensorController.getAll);
router.get('/:id', powerSensorController.getById);
router.post('/', powerSensorController.create);
router.put('/:id', powerSensorController.update);
router.delete('/:id', powerSensorController.remove);

export default router;
