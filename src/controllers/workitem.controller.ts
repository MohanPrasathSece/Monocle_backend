import { Request, Response } from 'express';
import { WorkItemService } from '../services/workitem.service';

export class WorkItemController {
    /**
     * Create a new work item
     */
    static async createItem(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || req.body.userId;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            const itemData = { ...req.body, userId };
            const item = await WorkItemService.createItem(itemData);
            res.status(201).json({ success: true, data: item });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get item by ID
     */
    static async getItem(req: Request, res: Response) {
        try {
            const item = await WorkItemService.getItemById(req.params.id);
            if (!item) {
                return res.status(404).json({ success: false, error: 'Item not found' });
            }
            res.json({ success: true, data: item });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get all items for a user
     */
    static async getUserItems(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req as any).user?.id;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            const items = await WorkItemService.getUserItems(userId);
            res.json({ success: true, data: items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get items by type
     */
    static async getItemsByType(req: Request, res: Response) {
        try {
            const items = await WorkItemService.getItemsByType(req.params.userId, req.params.type);
            res.json({ success: true, data: items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get items for a thread
     */
    static async getThreadItems(req: Request, res: Response) {
        try {
            const items = await WorkItemService.getThreadItems(req.params.threadId);
            res.json({ success: true, data: items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get unread items
     */
    static async getUnreadItems(req: Request, res: Response) {
        try {
            const items = await WorkItemService.getUnreadItems(req.params.userId);
            res.json({ success: true, data: items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Mark item as read
     */
    static async markAsRead(req: Request, res: Response) {
        try {
            await WorkItemService.markAsRead(req.params.id);
            res.json({ success: true, message: 'Item marked as read' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update item
     */
    static async updateItem(req: Request, res: Response) {
        try {
            await WorkItemService.updateItem(req.params.id, req.body);
            res.json({ success: true, message: 'Item updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete item
     */
    static async deleteItem(req: Request, res: Response) {
        try {
            await WorkItemService.deleteItem(req.params.id);
            res.json({ success: true, message: 'Item deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Assign item to thread
     */
    static async assignToThread(req: Request, res: Response) {
        try {
            await WorkItemService.assignToThread(req.params.id, req.body.threadId);
            res.json({ success: true, message: 'Item assigned to thread' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    static async getTeamItems(req: Request, res: Response) {
        try {
            const items = await WorkItemService.getTeamItems(req.params.teamId);
            res.json({ success: true, data: items });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
