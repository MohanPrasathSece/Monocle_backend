import { Router } from 'express';
import { ThreadController } from '../controllers/thread.controller';

const router = Router();

// Thread routes
router.post('/', ThreadController.createThread);
router.get('/:id', ThreadController.getThread);
router.get('/user/:userId', ThreadController.getUserThreads);
router.get('/user/:userId/active', ThreadController.getActiveThreads);
router.get('/user/:userId/high-priority', ThreadController.getHighPriorityThreads);
router.get('/user/:userId/upcoming-deadlines', ThreadController.getUpcomingDeadlines);
router.put('/:id', ThreadController.updateThread);
router.put('/:id/progress', ThreadController.updateProgress);
router.put('/:id/ignore', ThreadController.toggleIgnore);
router.get('/team/:teamId', ThreadController.getTeamThreads);
router.delete('/:id', ThreadController.deleteThread);

export default router;
