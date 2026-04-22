import { Router } from 'express';
import * as perangkatIotController from '../controllers/perangkatIotController.js';

const router = Router();

router.get('/', perangkatIotController.getAll);
router.get('/:id', perangkatIotController.getById);
router.post('/', perangkatIotController.create);
router.put('/:id', perangkatIotController.update);
router.delete('/:id', perangkatIotController.remove);

export default router;
