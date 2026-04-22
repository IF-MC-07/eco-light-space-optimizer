import { Router } from 'express';
import * as logEnergiController from '../controllers/logEnergiController.js';

const router = Router();

router.get('/', logEnergiController.getAll);
router.get('/:id', logEnergiController.getById);
router.post('/', logEnergiController.create);
router.put('/:id', logEnergiController.update);
router.delete('/:id', logEnergiController.remove);

export default router;
