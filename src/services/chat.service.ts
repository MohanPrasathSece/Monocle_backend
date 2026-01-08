import { model } from '../config/ollama';
import { WorkThreadService } from './thread.service';
import { WorkItemService } from './workitem.service';
import { InsightService } from './insight.service';

export class ChatService {
    /**
     * Process a chat message from the user
     */
    static async processChat(userId: string, message: string, history: { role: 'user' | 'model', content: string }[] = []) {
        try {
            console.log(`Processing chat for user: ${userId}`);

            // Fetch user context for the AI
            let threads: any[] = [];
            let insights: any[] = [];

            try {
                threads = await WorkThreadService.getUserThreads(userId);
                insights = await InsightService.getActiveInsights(userId);
            } catch (ctxError) {
                console.warn('Failed to fetch user context for chat, proceeding with empty context:', ctxError);
            }

            const context = {
                threads: threads.slice(0, 5).map(t => ({
                    title: t.title,
                    priority: t.priority,
                    progress: t.progress,
                    deadline: t.deadline
                })),
                insights: insights.slice(0, 5).map(i => ({
                    title: i.title,
                    description: i.description,
                    severity: i.severity
                }))
            };

            const systemPrompt = `You are Monocle AI, a powerful work intelligence assistant. 
            You help users manage their work threads, insights, and productivity.
            
            USER CONTEXT:
            - Recent Threads: ${JSON.stringify(context.threads)}
            - Active Insights: ${JSON.stringify(context.insights)}
            
            GUIDELINES:
            1. Be concise, professional, and helpful.
            2. Use the provided context to answer questions about their work.
            3. If a user asks about their progress, refer to their threads.
            4. If a user is overloaded (high cognitive load), suggest focusing on one high-priority thread.
            5. You can suggest creating new threads or marking items as complete.
            
            Respond in Markdown format. Keep responses under 200 words unless detail is requested.`;

            const chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

            console.log('Sending message to AI model...');
            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Understood. I am Monocle AI, ready to assist you with your work intelligence. How can I help you today?' }]
                    },
                    ...chatHistory
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();
            console.log('AI response received successfully');
            return text;
        } catch (error: any) {
            console.error('Error in ChatService:', error);
            throw new Error(`Failed to process chat message: ${error.message}`);
        }
    }
}
