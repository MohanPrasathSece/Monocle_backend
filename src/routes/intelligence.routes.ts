import { Router } from 'express';
import { IntelligenceController } from '../controllers/intelligence.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Authenticate all intelligence routes
// router.use(authMiddleware as any);

router.post('/chat/:userId', IntelligenceController.chat);
router.post('/insights/:userId/generate', IntelligenceController.generateInsights);
router.get('/insights/:userId', IntelligenceController.getActiveInsights);
router.put('/insights/:id/dismiss', IntelligenceController.dismissInsight);

router.post('/recommendations/:userId/generate', IntelligenceController.generateRecommendations);
router.get('/recommendations/:userId', IntelligenceController.getActiveRecommendations);

router.post('/cognitive-load/:userId/calculate', IntelligenceController.calculateCognitiveLoad);
router.get('/cognitive-load/:userId', IntelligenceController.getLatestCognitiveLoad);

router.post('/record-activity', IntelligenceController.recordActivity);
router.get('/daily-stats/:userId', IntelligenceController.getDailyStats);

export default router;
