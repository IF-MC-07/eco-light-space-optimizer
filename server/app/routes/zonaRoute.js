import { Router } from 'express';
import * as zonaController from '../controllers/zonaController.js';

const router = Router();

router.get('/', zonaController.getAll);
router.get('/:id', zonaController.getById);
router.get('/:id/detail', zonaController.getDetail);
router.post('/', zonaController.create);
router.put('/:id', zonaController.update);
router.delete('/:id', zonaController.remove);

export default router;
