import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    /**
     * Register a new user
     */
    static async register(req: Request, res: Response) {
        try {
            const { user, token } = await UserService.register(req.body);
            res.status(201).json({ success: true, data: { user, token } });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Login user
     */
    static async login(req: Request, res: Response) {
        try {
            const { user, token } = await UserService.login(req.body);
            res.json({ success: true, data: { user, token } });
        } catch (error: any) {
            res.status(401).json({ success: false, error: error.message });
        }
    }

    /**
     * Google Login
     */
    static async googleLogin(req: Request, res: Response) {
        try {
            const { code } = req.body;
            const { user, token } = await UserService.googleLogin(code);
            res.json({ success: true, data: { user, token } });
        } catch (error: any) {
            res.status(401).json({ success: false, error: error.message });
        }
    }

    /**
     * Microsoft Login
     */
    static async microsoftLogin(req: Request, res: Response) {
        try {
            const { accessToken } = req.body;
            const { user, token } = await UserService.microsoftLogin(accessToken);
            res.json({ success: true, data: { user, token } });
        } catch (error: any) {
            res.status(401).json({ success: false, error: error.message });
        }
    }

    /**
     * Verify Email
     */
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.body;
            await UserService.verifyEmail(token);
            res.json({ success: true, message: 'Email verified successfully' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Forgot Password
     */
    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await UserService.requestPasswordReset(email);
            res.json({ success: true, message: 'Password reset link sent to your email' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Reset Password
     */
    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, password } = req.body;
            await UserService.resetPassword(token, password);
            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Create a new user
     */
    static async createUser(req: Request, res: Response) {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user by ID
     */
    static async getUser(req: Request, res: Response) {
        try {
            const user = await UserService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(req: Request, res: Response) {
        try {
            const user = await UserService.getUserByEmail(req.query.email as string);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update user
     */
    static async updateUser(req: Request, res: Response) {
        try {
            await UserService.updateUser(req.params.id, req.body);
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(req: Request, res: Response) {
        try {
            await UserService.updatePreferences(req.params.id, req.body);
            res.json({ success: true, message: 'Preferences updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(req: Request, res: Response) {
        try {
            await UserService.deleteUser(req.params.id);
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    /**
     * Seed Data (Demo)
     */
    static async seedData(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const result = await UserService.seedRichData(userId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
