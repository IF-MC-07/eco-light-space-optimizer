import { Router } from 'express';
import * as zoneController from '../controllers/zoneController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, zoneController.getAll);
router.get('/camera/:cameraId', authenticate, zoneController.getByCamera);
router.get('/:id', authenticate, zoneController.getById);
router.get('/:id/detail', authenticate, zoneController.getDetail);
router.post('/simpan', authenticate, zoneController.simpan);
router.post('/', authenticate, zoneController.create);
router.put('/:id', authenticate, zoneController.update);
router.delete('/:id', authenticate, zoneController.deleteZone);

export default router;
