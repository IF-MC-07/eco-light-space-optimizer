import { Router } from 'express';
import * as ruanganController from '../controllers/ruanganController.js';

const router = Router();

router.get('/', ruanganController.getAll);
router.get('/:id', ruanganController.getById);
router.post('/', ruanganController.create);
router.put('/:id', ruanganController.update);
router.delete('/:id', ruanganController.remove);

export default router;
