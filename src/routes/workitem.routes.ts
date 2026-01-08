import { Router } from 'express';
import { WorkItemController } from '../controllers/workitem.controller';

const router = Router();

// Work item routes
router.post('/', WorkItemController.createItem);
router.get('/:id', WorkItemController.getItem);
router.get('/user/:userId', WorkItemController.getUserItems);
router.get('/user/:userId/type/:type', WorkItemController.getItemsByType);
router.get('/user/:userId/unread', WorkItemController.getUnreadItems);
router.get('/thread/:threadId', WorkItemController.getThreadItems);
router.get('/team/:teamId', WorkItemController.getTeamItems);
router.put('/:id', WorkItemController.updateItem);
router.put('/:id/read', WorkItemController.markAsRead);
router.put('/:id/assign', WorkItemController.assignToThread);
router.delete('/:id', WorkItemController.deleteItem);

export default router;
