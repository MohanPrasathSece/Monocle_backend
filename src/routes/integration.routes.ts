import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware as any);
router.post('/google/sync', IntegrationController.syncGoogle);
router.post('/microsoft/sync', IntegrationController.syncMicrosoft);

export default router;
