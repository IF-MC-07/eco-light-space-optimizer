import { Router } from 'express';
import * as detectionLogController from '../controllers/detectionLogController.js';

const router = Router();

router.get('/', detectionLogController.getAll);
router.get('/:id', detectionLogController.getById);
router.post('/', detectionLogController.create);
router.put('/:id', detectionLogController.update);
router.delete('/:id', detectionLogController.remove);

export default router;
