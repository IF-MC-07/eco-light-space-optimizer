import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';

const router = Router();

router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);
router.post('/', roomController.create);
router.put('/:id', roomController.update);
router.delete('/:id', roomController.remove);

export default router;
