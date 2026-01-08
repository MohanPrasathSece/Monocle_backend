import { WorkThread } from '../types';
import { WorkThreadModel } from '../models/WorkThread';

export class WorkThreadService {
    /**
     * Create a new work thread
     */
    static async createThread(thread: Omit<WorkThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkThread> {
        const now = new Date();
        const newThread = new WorkThreadModel({
            ...thread,
            createdAt: now,
            updatedAt: now,
        });

        try {
            await newThread.save();
            return newThread.toJSON() as unknown as WorkThread;
        } catch (error: any) {
            console.error('Error creating thread in MongoDB:', error);
            throw error;
        }
    }

    /**
     * Get thread by ID
     */
    static async getThreadById(threadId: string): Promise<WorkThread | null> {
        try {
            const threadDoc = await WorkThreadModel.findById(threadId);

            if (!threadDoc) {
                return null;
            }

            return threadDoc.toJSON() as unknown as WorkThread;
        } catch (error: any) {
            console.error(`Error getting thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Get all threads for a user
     */
    static async getUserThreads(userId: string): Promise<WorkThread[]> {
        try {
            const threads = await WorkThreadModel.find({ userId }).sort({ lastActivity: -1 });
            return threads.map(t => t.toJSON() as unknown as WorkThread);
        } catch (error: any) {
            console.error('Error getting user threads:', error);
            throw error;
        }
    }

    /**
     * Get active threads (not ignored)
     */
    static async getActiveThreads(userId: string): Promise<WorkThread[]> {
        try {
            const threads = await WorkThreadModel.find({
                userId,
                isIgnored: false
            }).sort({ lastActivity: -1 });
            return threads.map(t => t.toJSON() as unknown as WorkThread);
        } catch (error: any) {
            console.error('Error getting active threads:', error);
            throw error;
        }
    }

    /**
     * Get high priority threads
     */
    static async getHighPriorityThreads(userId: string): Promise<WorkThread[]> {
        try {
            const threads = await WorkThreadModel.find({
                userId,
                priority: 'high'
            }).sort({ lastActivity: -1 });
            return threads.map(t => t.toJSON() as unknown as WorkThread);
        } catch (error: any) {
            console.error('Error getting high priority threads:', error);
            throw error;
        }
    }

    /**
     * Update thread
     */
    static async updateThread(threadId: string, updates: Partial<WorkThread>): Promise<void> {
        await WorkThreadModel.findByIdAndUpdate(threadId, {
            ...updates,
            updatedAt: new Date()
        });
    }

    /**
     * Update thread progress
     */
    static async updateProgress(threadId: string, progress: number): Promise<void> {
        await WorkThreadModel.findByIdAndUpdate(threadId, {
            progress,
            updatedAt: new Date(),
        });
    }

    /**
     * Ignore/Un-ignore thread
     */
    static async toggleIgnoreThread(threadId: string, isIgnored: boolean): Promise<void> {
        await WorkThreadModel.findByIdAndUpdate(threadId, {
            isIgnored,
            updatedAt: new Date(),
        });
    }

    /**
     * Delete thread
     */
    static async deleteThread(threadId: string): Promise<void> {
        await WorkThreadModel.findByIdAndDelete(threadId);
    }

    /**
     * Get threads with upcoming deadlines
     */
    static async getThreadsWithUpcomingDeadlines(userId: string, daysAhead: number = 7): Promise<WorkThread[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const threads = await WorkThreadModel.find({
            userId,
            deadline: { $lte: futureDate, $gte: new Date() }
        }).sort({ deadline: 1 });

        return threads.map(t => t.toJSON() as unknown as WorkThread);
    }
    static async getTeamThreads(teamId: string): Promise<WorkThread[]> {
        try {
            const threads = await WorkThreadModel.find({ teamId }).sort({ lastActivity: -1 });
            return threads.map(t => t.toJSON() as unknown as WorkThread);
        } catch (error: any) {
            console.error('Error getting team threads:', error);
            throw error;
        }
    }
}
