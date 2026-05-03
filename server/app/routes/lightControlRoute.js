import { Router } from 'express';
import * as lightControlController from '../controllers/lightControlController.js';

const router = Router();

router.get('/', lightControlController.getAll);
router.get('/:id', lightControlController.getById);
router.post('/', lightControlController.create);
router.put('/:id', lightControlController.update);
router.patch('/:id/toggle', lightControlController.toggle);
router.delete('/:id', lightControlController.remove);

export default router;
