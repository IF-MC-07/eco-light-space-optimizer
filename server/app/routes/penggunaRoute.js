import { Router } from 'express';
import * as penggunaController from '../controllers/penggunaController.js';

const router = Router();

router.get('/', penggunaController.getAll);
router.get('/:id', penggunaController.getById);
router.post('/', penggunaController.create);
router.put('/:id', penggunaController.update);
router.delete('/:id', penggunaController.remove);

export default router;
