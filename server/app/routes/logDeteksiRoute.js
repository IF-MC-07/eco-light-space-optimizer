import { Router } from 'express';
import * as logDeteksiController from '../controllers/logDeteksiController.js';

const router = Router();

router.get('/', logDeteksiController.getAll);
router.get('/:id', logDeteksiController.getById);
router.post('/', logDeteksiController.create);
router.put('/:id', logDeteksiController.update);
router.delete('/:id', logDeteksiController.remove);

export default router;
