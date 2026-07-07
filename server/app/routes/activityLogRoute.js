import { Router } from 'express';
import * as activityLogController from '../controllers/activityLogController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, activityLogController.getAll);

export default router;
