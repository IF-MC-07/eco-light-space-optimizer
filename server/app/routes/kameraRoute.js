import { Router } from 'express';
import * as kameraController from '../controllers/kameraController.js';

const router = Router();

router.get('/', kameraController.getAll);
router.get('/:id', kameraController.getById);
router.post('/', kameraController.create);
router.put('/:id', kameraController.update);
router.delete('/:id', kameraController.remove);

export default router;
