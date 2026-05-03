import { Router } from 'express';
import * as energyLogController from '../controllers/energyLogController.js';

const router = Router();

router.get('/', energyLogController.getAll);
router.get('/:id', energyLogController.getById);
router.post('/', energyLogController.create);
router.put('/:id', energyLogController.update);
router.delete('/:id', energyLogController.remove);

export default router;
