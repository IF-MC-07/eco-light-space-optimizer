import { Router } from 'express';
import * as kontrolAcController from '../controllers/kontrolAcController.js';

const router = Router();

router.get('/', kontrolAcController.getAll);
router.get('/:id', kontrolAcController.getById);
router.post('/', kontrolAcController.create);
router.put('/:id', kontrolAcController.update);
router.patch('/:id/toggle', kontrolAcController.toggle);
router.delete('/:id', kontrolAcController.remove);

export default router;
