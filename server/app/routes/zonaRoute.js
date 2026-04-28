import { Router } from 'express';
import * as zonaController from '../controllers/zonaController.js';

const router = Router();

router.get('/', zonaController.getAll);
router.get('/kamera/:idKamera', zonaController.getByKamera);
router.get('/:id', zonaController.getById);
router.get('/:id/detail', zonaController.getDetail);
router.post('/simpan', zonaController.simpan);
router.post('/', zonaController.create);
router.put('/:id', zonaController.update);
router.delete('/:id', zonaController.deleteZona);

export default router;
