import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/User';
import { WorkItemService } from './workitem.service';
import { WorkItemModel } from '../models/WorkItem';
import { WorkThreadModel } from '../models/WorkThread';
import { model } from '../config/ollama';

export class IntegrationService {
    private static async getOrCreateExternalThread(userId: string): Promise<string> {
        let thread = await WorkThreadModel.findOne({ userId, title: 'External Imports' });
        if (!thread) {
            thread = new WorkThreadModel({
                userId,
                title: 'External Imports',
                description: 'Automatically imported items from Google Workspace and other integrations.',
                priority: 'medium',
                progress: 0,
                lastActivity: new Date(),
                itemIds: []
            });
            await thread.save();
        }
        return (thread._id as any).toString();
    }

    private static createOAuthClient(accessToken: string, refreshToken?: string): OAuth2Client {
        const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        return client;
    }

    /**
     * Internal method to classify if an email is work-related and assign priority
     */
    private static async classifyAndPrioritizeEmail(subject: string, from: string, snippet: string): Promise<{ isWork: boolean, priority: 'high' | 'medium' | 'low', reason?: string } | null> {
        try {
            const prompt = `Analyze this email and determine if it is "Work-related" or "Personal/Newsletter".
If it is Work-related, assign a priority: "high", "medium", or "low".
Work-related means: projects, client communication, team updates, meeting invites, urgent requests, technical issues.
Non-work means: social media notifications, generic newsletters, advertisements, personal chat, receipts (unless business), spam.

Email Subject: ${subject}
From: ${from}
Snippet: ${snippet}

Respond ONLY in JSON format:
{
  "isWork": boolean,
  "priority": "high" | "medium" | "low",
  "reason": "brief reason why"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { isWork: true, priority: 'medium' }; // Fallback
        } catch (error) {
            console.error('Email classification error:', error);
            return { isWork: true, priority: 'medium' }; // Fallback
        }
    }

    /**
     * Sync Gmail messages for a user
     */
    static async syncGmail(userId: string, overrideAccessToken?: string): Promise<number> {
        const user = await UserModel.findById(userId);
        if (!user) return 0;

        const integrations = (user as any).integrations;
        const accessToken = overrideAccessToken || integrations?.google?.accessToken;
        const refreshToken = integrations?.google?.refreshToken;

        if (!accessToken) {
            console.error('No Google access token found for user:', userId);
            return 0;
        }

        const auth = this.createOAuthClient(accessToken, refreshToken);
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            // Fetch recent messages
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 15, // Check slightly more to account for filtering
                q: 'is:unread'
            });

            const messages = res.data.messages || [];
            let count = 0;

            for (const msg of messages) {
                const details = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id!
                });

                const headers = details.data.payload?.headers;
                const subject = headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                const from = headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
                const date = new Date(parseInt(details.data.internalDate!));
                const snippet = details.data.snippet || '';

                // Check if already exists
                const existing = await WorkItemModel.findOne({ userId, 'metadata.googleId': msg.id });
                if (existing) {
                    continue;
                }

                // AI CLASSIFICATION
                const analysis = await this.classifyAndPrioritizeEmail(subject, from, snippet);

                // Skip if not work-related
                if (!analysis || !analysis.isWork) {
                    console.log(`Skipping non-work email: ${subject}`);
                    continue;
                }

                const externalThreadId = await this.getOrCreateExternalThread(userId);

                const newItem = await WorkItemService.createItem({
                    userId,
                    type: 'email',
                    title: subject,
                    source: `Gmail: ${from}`,
                    timestamp: date,
                    preview: snippet,
                    isRead: false,
                    priority: analysis.priority,
                    threadId: externalThreadId,
                    metadata: {
                        googleId: msg.id,
                        threadId: details.data.threadId,
                        aiReason: analysis.reason
                    }
                });

                // Update thread last activity and item list
                await WorkThreadModel.findByIdAndUpdate(externalThreadId, {
                    $addToSet: { itemIds: (newItem as any).id || (newItem as any)._id },
                    lastActivity: new Date(),
                    // Update thread priority if this email is high priority
                    ...(analysis.priority === 'high' ? { priority: 'high' } : {})
                });

                count++;
            }

            if (integrations?.google) {
                integrations.google.lastSync = new Date();
                await user.save();
            }

            return count;
        } catch (error: any) {
            console.error('Gmail sync error:', error.message);
            return 0;
        }
    }

    /**
     * Sync Calendar events for a user
     */
    static async syncCalendar(userId: string, overrideAccessToken?: string): Promise<number> {
        const user = await UserModel.findById(userId);
        if (!user) return 0;

        const integrations = (user as any).integrations;
        const accessToken = overrideAccessToken || integrations?.google?.accessToken;
        const refreshToken = integrations?.google?.refreshToken;

        if (!accessToken) return 0;

        const auth = this.createOAuthClient(accessToken, refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = res.data.items || [];
            let count = 0;

            for (const event of events) {
                // Check if already exists
                const existing = await WorkItemModel.findOne({ userId, 'metadata.googleId': event.id });
                if (existing) {
                    continue;
                }

                const externalThreadId = await this.getOrCreateExternalThread(userId);

                const newItem = await WorkItemService.createItem({
                    userId,
                    type: 'calendar',
                    title: event.summary || 'Meeting',
                    source: 'Google Calendar',
                    timestamp: new Date(event.start?.dateTime || event.start?.date || ''),
                    preview: event.description || '',
                    isRead: false,
                    priority: 'medium', // Default for calendar events
                    threadId: externalThreadId,
                    metadata: {
                        googleId: event.id,
                        status: event.status,
                        location: event.location
                    }
                });

                // Update thread last activity and item list
                await WorkThreadModel.findByIdAndUpdate(externalThreadId, {
                    $addToSet: { itemIds: (newItem as any).id || (newItem as any)._id },
                    lastActivity: new Date()
                });

                count++;
            }

            return count;
        } catch (error: any) {
            console.error('Calendar sync error:', error.message);
            return 0;
        }
    }

    /**
     * Sync Google Tasks for a user
     */
    static async syncTasks(userId: string, overrideAccessToken?: string): Promise<number> {
        const user = await UserModel.findById(userId);
        if (!user) return 0;

        const integrations = (user as any).integrations;
        const accessToken = overrideAccessToken || integrations?.google?.accessToken;
        const refreshToken = integrations?.google?.refreshToken;

        if (!accessToken) return 0;

        const auth = this.createOAuthClient(accessToken, refreshToken);
        const tasks = google.tasks({ version: 'v1', auth });

        try {
            // Get all task lists
            const taskListsRes = await tasks.tasklists.list();
            const taskLists = taskListsRes.data.items || [];
            let count = 0;

            for (const list of taskLists) {
                const tasksRes = await tasks.tasks.list({
                    tasklist: list.id!,
                    showCompleted: false,
                    maxResults: 20
                });

                const taskItems = tasksRes.data.items || [];
                for (const task of taskItems) {
                    // Check if already exists
                    const existing = await WorkItemModel.findOne({ userId, 'metadata.googleId': task.id });
                    if (existing) {
                        continue;
                    }

                    const externalThreadId = await this.getOrCreateExternalThread(userId);

                    const newItem = await WorkItemService.createItem({
                        userId,
                        type: 'task',
                        title: task.title || 'Untitled Task',
                        source: `Google Tasks: ${list.title}`,
                        timestamp: task.due ? new Date(task.due) : new Date(),
                        preview: task.notes || '',
                        isRead: false,
                        priority: 'medium',
                        threadId: externalThreadId,
                        metadata: {
                            googleId: task.id,
                            listId: list.id,
                            status: task.status
                        }
                    });

                    // Update thread last activity and item list
                    await WorkThreadModel.findByIdAndUpdate(externalThreadId, {
                        $addToSet: { itemIds: (newItem as any).id || (newItem as any)._id },
                        lastActivity: new Date()
                    });

                    count++;
                }
            }

            return count;
        } catch (error: any) {
            console.error('Tasks sync error:', error.message);
            return 0;
        }
    }
    /**
     * Sync Microsoft Teams messages for a user
     */
    static async syncTeams(userId: string, overrideAccessToken?: string): Promise<number> {
        const user = await UserModel.findById(userId);
        if (!user) return 0;

        const integrations = (user as any).integrations;
        const accessToken = overrideAccessToken || integrations?.microsoft?.accessToken;

        if (!accessToken) {
            console.error('No Microsoft access token found for user:', userId);
            return 0;
        }

        try {
            // Fetch recent chats from Microsoft Graph
            const response = await fetch('https://graph.microsoft.com/v1.0/me/chats?$expand=lastMessagePreview&$top=10&$orderby=lastUpdatedDateTime desc', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Microsoft token expired');
                    // In a real app, we would use refresh token here
                    return 0;
                }
                const errorText = await response.text();
                throw new Error(`Microsoft Graph API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            const chats = data.value || [];
            let count = 0;

            for (const chat of chats) {
                const lastMessage = chat.lastMessagePreview;
                if (!lastMessage || !lastMessage.body || !lastMessage.body.content) continue;

                const msgId = lastMessage.id;
                const existing = await WorkItemModel.findOne({ userId, 'metadata.microsoftId': msgId });
                if (existing) continue;

                // Determine title (chat name or sender)
                let title = chat.topic;
                if (!title && chat.chatType === 'oneOnOne') {
                    // Start of discussion with specific person
                    title = lastMessage.from?.user?.displayName || 'Teams Chat';
                } else if (!title) {
                    title = 'Group Chat';
                }

                const externalThreadId = await this.getOrCreateExternalThread(userId);

                const newItem = await WorkItemService.createItem({
                    userId,
                    type: 'message',
                    title: title,
                    source: 'Microsoft Teams',
                    timestamp: new Date(lastMessage.createdDateTime || new Date()),
                    preview: lastMessage.body.content,
                    isRead: false, // Assume unread if we are just fetching it now
                    priority: 'medium',
                    threadId: externalThreadId,
                    metadata: {
                        microsoftId: msgId,
                        chatId: chat.id,
                        webUrl: chat.webUrl
                    }
                });

                // Update thread last activity and item list
                await WorkThreadModel.findByIdAndUpdate(externalThreadId, {
                    $addToSet: { itemIds: (newItem as any).id || (newItem as any)._id },
                    lastActivity: new Date()
                });

                count++;
            }

            // Update last sync time
            if (user.integrations?.microsoft) {
                // We need to use updateOne because we might rely on the 'any' cast above for runtime, but cleaner for TS
                await UserModel.updateOne(
                    { _id: userId },
                    { $set: { 'integrations.microsoft.lastSync': new Date() } }
                );
            }

            return count;
        } catch (error: any) {
            console.error('Microsoft Teams sync error:', error.message);
            return 0;
        }
    }
    /**
     * Create a Google Calendar event
     */
    static async createCalendarEvent(userId: string, eventDetails: { title: string, description: string, startTime: string, endTime: string, attendees: string[] }): Promise<string> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        const accessToken = user.integrations?.google?.accessToken;
        if (!accessToken) throw new Error('Google integration not connected');

        const auth = this.createOAuthClient(accessToken, user.integrations?.google?.refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
            summary: eventDetails.title,
            description: eventDetails.description,
            start: {
                dateTime: new Date(eventDetails.startTime).toISOString(),
            },
            end: {
                dateTime: new Date(eventDetails.endTime).toISOString(),
            },
            attendees: eventDetails.attendees.map((email: string) => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };

        try {
            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all' // Sends email notifications to attendees
            });

            return res.data.htmlLink || '';
        } catch (error: any) {
            console.error('Create Calendar Event error:', error.message);
            throw new Error(`Failed to create meeting: ${error.message}`);
        }
    }

    /**
     * Create a Microsoft Teams meeting
     */
    static async createTeamsMeeting(userId: string, eventDetails: { title: string, description: string, startTime: string, endTime: string, attendees: string[] }): Promise<{ meetingLink: string, joinUrl: string }> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        const accessToken = user.integrations?.microsoft?.accessToken;
        if (!accessToken) throw new Error('Microsoft integration not connected');

        const event = {
            subject: eventDetails.title,
            body: {
                contentType: 'HTML',
                content: eventDetails.description || ''
            },
            start: {
                dateTime: new Date(eventDetails.startTime).toISOString(),
                timeZone: 'UTC'
            },
            end: {
                dateTime: new Date(eventDetails.endTime).toISOString(),
                timeZone: 'UTC'
            },
            attendees: eventDetails.attendees.map((email: string) => ({
                emailAddress: { address: email },
                type: 'required'
            })),
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness'
        };

        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Microsoft Graph API error: ${response.status} ${errorText}`);
            }

            const data: any = await response.json();

            return {
                meetingLink: data.webLink || '',
                joinUrl: data.onlineMeeting?.joinUrl || ''
            };
        } catch (error: any) {
            console.error('Create Teams Meeting error:', error.message);
            throw new Error(`Failed to create Teams meeting: ${error.message}`);
        }
    }
}
