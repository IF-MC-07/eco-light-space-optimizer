import { Router } from 'express';
import * as kontrolLampuController from '../controllers/kontrolLampuController.js';

const router = Router();

router.get('/', kontrolLampuController.getAll);
router.get('/:id', kontrolLampuController.getById);
router.post('/', kontrolLampuController.create);
router.put('/:id', kontrolLampuController.update);
router.delete('/:id', kontrolLampuController.remove);

export default router;
