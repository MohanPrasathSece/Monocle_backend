import { WorkItem } from '../types';
import { WorkItemModel } from '../models/WorkItem';
import { MailService } from './mail.service';
import { UserService } from './user.service';

export class WorkItemService {
    /**
     * Create a new work item
     */
    static async createItem(item: Omit<WorkItem, 'id'>): Promise<WorkItem> {
        const newItem = new WorkItemModel({
            ...item,
            timestamp: item.timestamp || new Date()
        });

        try {
            await newItem.save();

            // Send email if assigned
            if (newItem.assigneeId) {
                const assignee = await UserService.getUserById(newItem.assigneeId);
                if (assignee && assignee.email) {
                    const link = `${process.env.FRONTEND_URL || 'https://monocle-frontend-seven.vercel.app'}/dashboard`;
                    // Fire and forget email to not block response
                    MailService.sendTaskAssignment(assignee.email, newItem.title, link).catch(err =>
                        console.error('Failed to send assignment email:', err)
                    );
                }
            }

            return newItem.toJSON() as unknown as WorkItem;
        } catch (error: any) {
            console.error('Error creating work item in MongoDB:', error);
            throw error;
        }
    }

    /**
     * Get item by ID
     */
    static async getItemById(itemId: string): Promise<WorkItem | null> {
        try {
            const itemDoc = await WorkItemModel.findById(itemId);

            if (!itemDoc) {
                return null;
            }

            return itemDoc.toJSON() as unknown as WorkItem;
        } catch (error: any) {
            console.error(`Error getting work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Get all items for a user
     */
    static async getUserItems(userId: string): Promise<WorkItem[]> {
        try {
            const items = await WorkItemModel.find({ userId }).sort({ timestamp: -1 });
            return items.map(i => i.toJSON() as unknown as WorkItem);
        } catch (error: any) {
            console.error('Error getting user items:', error);
            throw error;
        }
    }

    /**
     * Get items by type
     */
    static async getItemsByType(userId: string, type: string): Promise<WorkItem[]> {
        try {
            const items = await WorkItemModel.find({ userId, type }).sort({ timestamp: -1 });
            return items.map(i => i.toJSON() as unknown as WorkItem);
        } catch (error: any) {
            console.error(`Error getting items of type ${type} for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get items for a thread
     */
    static async getThreadItems(threadId: string): Promise<WorkItem[]> {
        try {
            const items = await WorkItemModel.find({ threadId }).sort({ timestamp: -1 });
            return items.map(i => i.toJSON() as unknown as WorkItem);
        } catch (error: any) {
            console.error(`Error getting items for thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Get unread items
     */
    static async getUnreadItems(userId: string): Promise<WorkItem[]> {
        try {
            const items = await WorkItemModel.find({ userId, isRead: false }).sort({ timestamp: -1 });
            return items.map(i => i.toJSON() as unknown as WorkItem);
        } catch (error: any) {
            console.error('Error getting unread items:', error);
            throw error;
        }
    }

    /**
     * Mark item as read
     */
    static async markAsRead(itemId: string): Promise<void> {
        try {
            await WorkItemModel.findByIdAndUpdate(itemId, { isRead: true });
        } catch (error: any) {
            console.error(`Error marking item ${itemId} as read:`, error);
            throw error;
        }
    }

    /**
     * Update item
     */
    static async updateItem(itemId: string, updates: Partial<WorkItem>): Promise<void> {
        try {
            await WorkItemModel.findByIdAndUpdate(itemId, updates);
        } catch (error: any) {
            console.error(`Error updating work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Delete item
     */
    static async deleteItem(itemId: string): Promise<void> {
        try {
            await WorkItemModel.findByIdAndDelete(itemId);
        } catch (error: any) {
            console.error(`Error deleting work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Assign item to thread
     */
    static async assignToThread(itemId: string, threadId: string): Promise<void> {
        try {
            await WorkItemModel.findByIdAndUpdate(itemId, { threadId });
        } catch (error: any) {
            console.error(`Error assigning item ${itemId} to thread ${threadId}:`, error);
            throw error;
        }
    }

    static async getTeamItems(teamId: string): Promise<WorkItem[]> {
        try {
            const items = await WorkItemModel.find({ teamId }).sort({ timestamp: -1 });
            return items.map(i => i.toJSON() as unknown as WorkItem);
        } catch (error: any) {
            console.error('Error getting team items:', error);
            throw error;
        }
    }
}
