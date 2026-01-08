import { model } from '../config/ollama';
import { PriorityRecommendation, WorkThread } from '../types';
import { WorkThreadService } from './thread.service';
import { PriorityRecommendationModel } from '../models/PriorityRecommendation';

export class PriorityService {
    /**
     * Generate priority recommendations for a user using AI
     */
    static async generateRecommendations(userId: string): Promise<PriorityRecommendation[]> {
        const threads = await WorkThreadService.getActiveThreads(userId);
        const recommendations: PriorityRecommendation[] = [];

        for (const thread of threads) {
            const score = this.calculatePriorityScore(thread);

            if (score >= 50) {
                try {
                    // Use Ollama AI to generate reasoning
                    const prompt = `Analyze this work thread and explain why it should be prioritized:
Thread: ${thread.title}
Priority: ${thread.priority}
Progress: ${thread.progress}%
Deadline: ${thread.deadline instanceof Date ? thread.deadline.toISOString() : (thread.deadline || 'None')}
Last Activity: ${thread.lastActivity instanceof Date ? thread.lastActivity.toISOString() : thread.lastActivity}

Provide a JSON response with:
{
  "title": "Brief title for why to prioritize",
  "description": "Detailed explanation",
  "factors": [
    {"label": "Factor name", "weight": "high|medium|low", "description": "Why this matters"}
  ]
}`;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();

                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const aiReasoning = JSON.parse(jsonMatch[0]);

                        const recommendation = await this.createRecommendation({
                            userId,
                            threadId: thread.id,
                            score,
                            reasoning: aiReasoning,
                            generatedAt: new Date(),
                            isActive: true,
                        });
                        recommendations.push(recommendation);
                    }
                } catch (error) {
                    console.error('Error generating AI recommendation:', error);

                    // Fallback to rule-based reasoning
                    const recommendation = await this.createRecommendation({
                        userId,
                        threadId: thread.id,
                        score,
                        reasoning: this.generateFallbackReasoning(thread),
                        generatedAt: new Date(),
                        isActive: true,
                    });
                    recommendations.push(recommendation);
                }
            }
        }

        // Sort by score descending
        return recommendations.sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate priority score based on multiple factors
     */
    private static calculatePriorityScore(thread: WorkThread): number {
        let score = 0;

        // Priority weight
        if (thread.priority === 'high') score += 40;
        else if (thread.priority === 'medium') score += 25;
        else score += 10;

        // Deadline proximity
        if (thread.deadline) {
            const daysUntilDeadline = (new Date(thread.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysUntilDeadline <= 1) score += 30;
            else if (daysUntilDeadline <= 3) score += 20;
            else if (daysUntilDeadline <= 7) score += 10;
        }

        // Low progress on high priority items
        if (thread.priority === 'high' && thread.progress < 50) {
            score += 15;
        }

        // Ignored work with deadlines
        if (thread.isIgnored && thread.deadline) {
            const daysUntilDeadline = (new Date(thread.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysUntilDeadline <= 3) score += 25;
        }

        // Near completion boost
        if (thread.progress >= 70 && thread.progress < 100) {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Generate fallback reasoning when AI fails
     */
    private static generateFallbackReasoning(thread: WorkThread) {
        const factors = [];

        if (thread.priority === 'high') {
            factors.push({
                label: 'High Priority',
                weight: 'high' as const,
                description: 'This thread is marked as high priority'
            });
        }

        if (thread.deadline) {
            const daysUntilDeadline = Math.ceil((new Date(thread.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            factors.push({
                label: 'Deadline Proximity',
                weight: daysUntilDeadline <= 2 ? 'high' as const : 'medium' as const,
                description: `Due in ${daysUntilDeadline} days`
            });
        }

        if (thread.progress < 50) {
            factors.push({
                label: 'Low Progress',
                weight: 'medium' as const,
                description: `Only ${thread.progress}% complete`
            });
        }

        return {
            title: thread.deadline ? 'Deadline approaching' : 'Priority work needs attention',
            description: `${thread.title} requires your focus to stay on track.`,
            factors
        };
    }

    /**
     * Create a new recommendation
     */
    static async createRecommendation(recommendation: Omit<PriorityRecommendation, 'id'>): Promise<PriorityRecommendation> {
        const newRec = new PriorityRecommendationModel({
            ...recommendation,
            generatedAt: recommendation.generatedAt || new Date()
        });

        await newRec.save();
        return newRec.toJSON() as unknown as PriorityRecommendation;
    }

    /**
     * Get active recommendations for a user
     */
    static async getActiveRecommendations(userId: string): Promise<PriorityRecommendation[]> {
        const recommendations = await PriorityRecommendationModel.find({
            userId,
            isActive: true
        }).sort({ score: -1 });

        return recommendations.map(r => r.toJSON() as unknown as PriorityRecommendation);
    }
}
