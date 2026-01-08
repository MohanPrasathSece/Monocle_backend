import { Request, Response } from 'express';
import { InsightService } from '../services/insight.service';
import { PriorityService } from '../services/priority.service';
import { AnalyticsService } from '../services/analytics.service';
import { ChatService } from '../services/chat.service';

export class IntelligenceController {
    /**
     * Generate insights for a user
     */
    static async generateInsights(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req as any).user?.id;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            const insights = await InsightService.generateInsights(userId);
            res.json({ success: true, data: insights });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get active insights
     */
    static async getActiveInsights(req: Request, res: Response) {
        try {
            const insights = await InsightService.getActiveInsights(req.params.userId);
            res.json({ success: true, data: insights });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Dismiss an insight
     */
    static async dismissInsight(req: Request, res: Response) {
        try {
            await InsightService.dismissInsight(req.params.id);
            res.json({ success: true, message: 'Insight dismissed' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Generate priority recommendations
     */
    static async generateRecommendations(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req as any).user?.id;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            const recommendations = await PriorityService.generateRecommendations(userId);
            res.json({ success: true, data: recommendations });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get active recommendations
     */
    static async getActiveRecommendations(req: Request, res: Response) {
        try {
            const recommendations = await PriorityService.getActiveRecommendations(req.params.userId);
            res.json({ success: true, data: recommendations });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Calculate cognitive load
     */
    static async calculateCognitiveLoad(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req as any).user?.id;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            const cognitiveLoad = await AnalyticsService.calculateCognitiveLoad(userId);
            res.json({ success: true, data: cognitiveLoad });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get latest cognitive load
     */
    static async getLatestCognitiveLoad(req: Request, res: Response) {
        try {
            const cognitiveLoad = await AnalyticsService.getLatestCognitiveLoad(req.params.userId);
            if (!cognitiveLoad) {
                return res.status(404).json({ success: false, error: 'Cognitive load data not found' });
            }
            res.json({ success: true, data: cognitiveLoad });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get daily stats
     */
    static async getDailyStats(req: Request, res: Response) {
        try {
            const daysAgo = parseInt(req.query.days as string) || 7;
            const stats = await AnalyticsService.getDailyStats(req.params.userId, daysAgo);
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update daily stats
     */
    static async updateDailyStats(req: Request, res: Response) {
        try {
            await AnalyticsService.updateDailyStats(req.params.userId, req.body);
            res.json({ success: true, message: 'Stats updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Record context switch
     */
    static async recordContextSwitch(req: Request, res: Response) {
        try {
            await AnalyticsService.incrementContextSwitches(req.params.userId);
            res.json({ success: true, message: 'Context switch recorded' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Record an activity
     */
    static async recordActivity(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || req.body.userId;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }
            await AnalyticsService.recordActivity({
                ...req.body,
                userId,
                timestamp: new Date()
            });
            res.json({ success: true, message: 'Activity recorded' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Record focus session
     */
    static async recordFocusSession(req: Request, res: Response) {
        try {
            const { durationMinutes, tasksCompleted } = req.body;
            await AnalyticsService.addFocusSession(req.params.userId, durationMinutes, tasksCompleted);
            res.json({ success: true, message: 'Focus session recorded' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get AI thread summary
     */
    static async getThreadSummary(req: Request, res: Response) {
        try {
            const summary = await InsightService.getThreadSummary(req.params.id);
            res.json({ success: true, data: summary });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Chat with AI
     */
    static async chat(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req as any).user?.id;
            const { message, history } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }

            const response = await ChatService.processChat(userId, message, history);
            res.json({ success: true, data: response });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
