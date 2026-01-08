import { Request, Response } from 'express';
import { IntegrationService } from '../services/integration.service';

export class IntegrationController {
    static async syncGoogle(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { accessToken } = req.body;
            const gmailCount = await IntegrationService.syncGmail(userId, accessToken);
            const calendarCount = await IntegrationService.syncCalendar(userId, accessToken);
            const tasksCount = await IntegrationService.syncTasks(userId, accessToken);

            res.status(200).json({
                message: 'Google sync completed',
                data: {
                    emailsSynced: gmailCount,
                    meetingsSynced: calendarCount,
                    tasksSynced: tasksCount
                }
            });
        } catch (error: any) {
            console.error('Integration error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async syncMicrosoft(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { accessToken } = req.body;
            const teamsCount = await IntegrationService.syncTeams(userId, accessToken);

            res.status(200).json({
                message: 'Microsoft sync completed',
                data: {
                    teamsSynced: teamsCount
                }
            });
        } catch (error: any) {
            console.error('Microsoft Integration error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
    static async createMeeting(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { title, description, startTime, endTime, attendees } = req.body;

            // Basic validation
            if (!title || !startTime || !endTime) {
                res.status(400).json({ error: 'Missing required fields: title, startTime, endTime' });
                return;
            }

            const meetingLink = await IntegrationService.createCalendarEvent(userId, {
                title,
                description,
                startTime,
                endTime,
                attendees: attendees || []
            });

            res.status(201).json({
                message: 'Meeting created successfully',
                data: {
                    meetingLink
                }
            });
        } catch (error: any) {
            console.error('Create Meeting error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
}
