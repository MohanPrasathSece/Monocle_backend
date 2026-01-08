import { CognitiveLoadState, DailyStats, Activity } from '../types';
import { WorkThreadService } from './thread.service';
import { CognitiveLoadStateModel } from '../models/CognitiveLoadState';
import { ActivityModel } from '../models/Activity';
import { DailyStatsModel } from '../models/DailyStats';

export class AnalyticsService {
    /**
     * Calculate current cognitive load
     */
    static async calculateCognitiveLoad(userId: string): Promise<CognitiveLoadState> {
        const activeThreads = await WorkThreadService.getActiveThreads(userId);
        const recentActivities = await this.getRecentActivities(userId, 1); // Last 1 hour

        // Calculate context switches in the last hour
        const contextSwitches = recentActivities.filter(a => a.type === 'context-switch').length;

        // Calculate work duration today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayActivities = recentActivities.filter(a => new Date(a.timestamp) >= todayStart);
        const workDuration = todayActivities.length > 0
            ? (Date.now() - new Date(todayActivities[todayActivities.length - 1].timestamp).getTime()) / (1000 * 60 * 60)
            : 0;

        // Count pending deadlines in next 7 days
        const upcomingDeadlines = await WorkThreadService.getThreadsWithUpcomingDeadlines(userId, 7);

        const factors = {
            activeThreads: activeThreads.length,
            switchingFrequency: contextSwitches,
            workDuration,
            pendingDeadlines: upcomingDeadlines.length,
        };

        // Calculate score (0-100)
        let score = 0;
        score += Math.min(30, activeThreads.length * 5); // Max 30 points
        score += Math.min(30, contextSwitches * 3); // Max 30 points
        score += Math.min(20, workDuration * 2.5); // Max 20 points
        score += Math.min(20, upcomingDeadlines.length * 4); // Max 20 points

        // Determine level
        let level: 'low' | 'medium' | 'high' | 'critical';
        if (score < 25) level = 'low';
        else if (score < 50) level = 'medium';
        else if (score < 75) level = 'high';
        else level = 'critical';

        const cognitiveLoad: CognitiveLoadState = {
            id: '', // Will be assigned by MongoDB
            userId,
            level,
            score,
            factors,
            timestamp: new Date(),
        };

        const savedLoad = await this.saveCognitiveLoad(cognitiveLoad);
        return savedLoad;
    }

    /**
     * Save cognitive load state
     */
    static async saveCognitiveLoad(load: CognitiveLoadState): Promise<CognitiveLoadState> {
        const newLoad = new CognitiveLoadStateModel({
            ...load,
            timestamp: load.timestamp || new Date()
        });
        await newLoad.save();
        return newLoad.toJSON() as unknown as CognitiveLoadState;
    }

    /**
     * Get latest cognitive load
     */
    static async getLatestCognitiveLoad(userId: string): Promise<CognitiveLoadState | null> {
        const doc = await CognitiveLoadStateModel.findOne({ userId }).sort({ timestamp: -1 });
        return doc ? (doc.toJSON() as unknown as CognitiveLoadState) : null;
    }

    /**
     * Record an activity
     */
    static async recordActivity(activity: Omit<Activity, 'id'>): Promise<void> {
        const newActivity = new ActivityModel({
            ...activity,
            timestamp: activity.timestamp || new Date()
        });
        await newActivity.save();
    }

    /**
     * Get recent activities
     */
    static async getRecentActivities(userId: string, hoursAgo: number): Promise<Activity[]> {
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

        const activities = await ActivityModel.find({
            userId,
            timestamp: { $gte: cutoffTime }
        }).sort({ timestamp: -1 });

        return activities.map(a => a.toJSON() as unknown as Activity);
    }

    /**
     * Update daily stats
     */
    static async updateDailyStats(userId: string, updates: Partial<Omit<DailyStats, 'id' | 'userId' | 'date'>>): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await DailyStatsModel.findOneAndUpdate(
            { userId, date: today },
            { $set: updates },
            { upsert: true, new: true }
        );
    }

    /**
     * Get daily stats for a date range
     */
    static async getDailyStats(userId: string, daysAgo: number = 7): Promise<DailyStats[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(0, 0, 0, 0);

        const stats = await DailyStatsModel.find({
            userId,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        return stats.map(s => s.toJSON() as unknown as DailyStats);
    }

    /**
     * Increment context switches
     */
    static async incrementContextSwitches(userId: string): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await DailyStatsModel.findOneAndUpdate(
            { userId, date: today },
            { $inc: { contextSwitches: 1 } },
            { upsert: true }
        );

        // Record activity
        await this.recordActivity({
            userId,
            type: 'context-switch',
            timestamp: new Date(),
            metadata: {},
        });
    }

    /**
     * Add a focus session records
     */
    static async addFocusSession(userId: string, durationMinutes: number, tasksCompleted: number = 0): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await DailyStatsModel.findOneAndUpdate(
            { userId, date: today },
            {
                $inc: {
                    focusTime: durationMinutes,
                    completedTasks: tasksCompleted
                }
            },
            { upsert: true }
        );

        // Record activity
        await this.recordActivity({
            userId,
            type: 'focus-session',
            timestamp: new Date(),
            metadata: { durationMinutes, tasksCompleted },
        });
    }

    /**
     * Get today's stats
     */
    private static async getTodayStats(userId: string): Promise<DailyStats | null> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const doc = await DailyStatsModel.findOne({ userId, date: today });
        return doc ? (doc.toJSON() as unknown as DailyStats) : null;
    }
}
