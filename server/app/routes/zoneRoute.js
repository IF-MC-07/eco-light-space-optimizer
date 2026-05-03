import { Router } from 'express';
import * as zoneController from '../controllers/zoneController.js';

const router = Router();

router.get('/', zoneController.getAll);
router.get('/camera/:cameraId', zoneController.getByKamera);
router.get('/:id', zoneController.getById);
router.get('/:id/detail', zoneController.getDetail);
router.post('/simpan', zoneController.simpan);
router.post('/', zoneController.create);
router.put('/:id', zoneController.update);
router.delete('/:id', zoneController.deleteZona);

export default router;
