import { Router } from 'express';
import * as sensorDayaController from '../controllers/sensorDayaController.js';

const router = Router();

router.get('/', sensorDayaController.getAll);
router.get('/:id', sensorDayaController.getById);
router.post('/', sensorDayaController.create);
router.put('/:id', sensorDayaController.update);
router.delete('/:id', sensorDayaController.remove);

export default router;
