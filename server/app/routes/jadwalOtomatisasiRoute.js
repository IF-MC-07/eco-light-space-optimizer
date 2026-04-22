import { Router } from 'express';
import * as jadwalOtomatisasiController from '../controllers/jadwalOtomatisasiController.js';

const router = Router();

router.get('/', jadwalOtomatisasiController.getAll);
router.get('/:id', jadwalOtomatisasiController.getById);
router.post('/', jadwalOtomatisasiController.create);
router.put('/:id', jadwalOtomatisasiController.update);
router.delete('/:id', jadwalOtomatisasiController.remove);

export default router;
