import { Router } from 'express';
import * as iotDeviceController from '../controllers/iotDeviceController.js';

const router = Router();

router.get('/', iotDeviceController.getAll);
router.get('/:id', iotDeviceController.getById);
router.post('/', iotDeviceController.create);
router.put('/:id', iotDeviceController.update);
router.delete('/:id', iotDeviceController.remove);

export default router;
