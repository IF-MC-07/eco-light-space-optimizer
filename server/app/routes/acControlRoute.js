import { Router } from 'express';
import * as acControlController from '../controllers/acControlController.js';

const router = Router();

router.get('/', acControlController.getAll);
router.get('/:id', acControlController.getById);
router.post('/', acControlController.create);
router.put('/:id', acControlController.update);
router.patch('/:id/toggle', acControlController.toggle);
router.delete('/:id', acControlController.remove);

export default router;
