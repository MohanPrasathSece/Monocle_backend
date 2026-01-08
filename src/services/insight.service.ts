import { model } from '../config/ollama';
import { WorkInsight } from '../types';
import { WorkThreadService } from './thread.service';
import { WorkInsightModel } from '../models/WorkInsight';

export class InsightService {
    /**
     * Generate insights for a user using AI
     */
    static async generateInsights(userId: string): Promise<WorkInsight[]> {
        const threads = await WorkThreadService.getUserThreads(userId);
        const insights: WorkInsight[] = [];

        // Check for ignored work
        const ignoredThreads = threads.filter(t => t.isIgnored && t.deadline);
        for (const thread of ignoredThreads) {
            if (thread.deadline) {
                const daysUntilDeadline = Math.ceil((new Date(thread.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                if (daysUntilDeadline <= 3) {
                    const insight = await this.createInsight({
                        userId,
                        type: 'ignored-work',
                        title: `${thread.title} needs attention`,
                        description: `This work thread has a deadline in ${daysUntilDeadline} days but has been marked as ignored.`,
                        severity: daysUntilDeadline <= 1 ? 'critical' : 'warning',
                        relatedThreadIds: [thread.id],
                        actionSuggestion: `Consider unblocking time to work on this before the deadline.`,
                        detectedAt: new Date(),
                        isActive: true,
                        isDismissed: false
                    });
                    insights.push(insight);
                }
            }
        }

        // Check for deadline risks
        const activeThreads = threads.filter(t => !t.isIgnored && t.deadline);
        for (const thread of activeThreads) {
            if (thread.deadline) {
                const daysUntilDeadline = Math.ceil((new Date(thread.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const progressPerDay = thread.progress / Math.max(1, Math.ceil((Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
                const requiredProgressPerDay = (100 - thread.progress) / Math.max(1, daysUntilDeadline);

                if (requiredProgressPerDay > progressPerDay * 1.5 && thread.progress < 80) {
                    const insight = await this.createInsight({
                        userId,
                        type: 'deadline-risk',
                        title: `${thread.title} at risk`,
                        description: `With current progress rate (${progressPerDay.toFixed(1)}% per day), you may not complete this before the deadline.`,
                        severity: 'critical',
                        relatedThreadIds: [thread.id],
                        actionSuggestion: `Block ${Math.ceil((100 - thread.progress) / 10)} hours of focus time to address this.`,
                        detectedAt: new Date(),
                        isActive: true,
                        isDismissed: false
                    });
                    insights.push(insight);
                }
            }
        }

        // Use Ollama AI for additional insights
        try {
            const threadsContext = threads.map(t => ({
                title: t.title,
                priority: t.priority,
                progress: t.progress,
                deadline: t.deadline instanceof Date ? t.deadline.toISOString() : t.deadline,
            }));

            const prompt = `Analyze these work threads and provide ONE actionable insight about work patterns or productivity:
${JSON.stringify(threadsContext, null, 2)}

Respond in JSON format:
{
  "type": "attention-leak" | "overload" | "momentum-drift",
  "title": "Brief title",
  "description": "Detailed description",
  "severity": "info" | "warning" | "critical",
  "actionSuggestion": "Specific action to take"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiInsight = JSON.parse(jsonMatch[0]);
                const insight = await this.createInsight({
                    userId,
                    type: aiInsight.type,
                    title: aiInsight.title,
                    description: aiInsight.description,
                    severity: aiInsight.severity,
                    actionSuggestion: aiInsight.actionSuggestion,
                    detectedAt: new Date(),
                    isActive: true,
                    isDismissed: false
                });
                insights.push(insight);
            }
        } catch (error) {
            console.error('Error generating AI insights:', error);
        }

        return insights;
    }

    /**
     * Create a new insight
     */
    static async createInsight(insight: Omit<WorkInsight, 'id'>): Promise<WorkInsight> {
        const newInsight = new WorkInsightModel({
            ...insight,
            detectedAt: insight.detectedAt || new Date()
        });

        await newInsight.save();
        return newInsight.toJSON() as unknown as WorkInsight;
    }

    /**
     * Get active insights for a user
     */
    static async getActiveInsights(userId: string): Promise<WorkInsight[]> {
        const insights = await WorkInsightModel.find({
            userId,
            isActive: true,
            isDismissed: { $ne: true }
        }).sort({ detectedAt: -1 });

        return insights.map(i => i.toJSON() as unknown as WorkInsight);
    }

    /**
     * Dismiss an insight
     */
    static async dismissInsight(insightId: string): Promise<void> {
        await WorkInsightModel.findByIdAndUpdate(insightId, { isDismissed: true });
    }

    /**
     * Delete old insights (cleanup)
     */
    static async deleteOldInsights(userId: string, daysOld: number = 30): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await WorkInsightModel.deleteMany({
            userId,
            detectedAt: { $lt: cutoffDate }
        });
    }

    /**
     * Generate an AI summary for a specific thread
     */
    static async getThreadSummary(threadId: string): Promise<{ summary: string, nextSteps: string[] }> {
        const thread = await WorkThreadService.getThreadById(threadId);
        if (!thread) throw new Error('Thread not found');

        // Fetch items for context
        // Note: For now, we'll assume the items are fetched elsewhere or just use the thread info
        // To be better, we should fetch items from WorkItemService here
        // But to keep it simple and avoid circular deps if they exist

        try {
            const context = {
                title: thread.title,
                description: thread.description,
                priority: thread.priority,
                progress: thread.progress,
            };

            const prompt = `Analyze this work thread and provide a concise summary and 3 prioritized next steps:
${JSON.stringify(context, null, 2)}

Respond ONLY in JSON format:
{
  "summary": "Consolidated summary of progress and state",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Could not parse AI response');
        } catch (error) {
            console.error('Error generating thread summary:', error);
            return {
                summary: `This is a ${thread.priority} priority thread about ${thread.title}. Current progress is ${thread.progress}%.`,
                nextSteps: ["Review pending items", "Update progress", "Set next deadline"]
            };
        }
    }
}
