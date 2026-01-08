import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, UserPreferences } from '../types';
import { UserModel } from '../models/User';
import { WorkThreadModel } from '../models/WorkThread';
import { WorkItemModel } from '../models/WorkItem';
import { MailService } from './mail.service';

// Initialized inside methods to ensure env vars are loaded
let googleClient: OAuth2Client | null = null;
const getGoogleClient = () => {
    if (!googleClient) {
        googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID || '636666241864-fronahev0ijj9vr0a0lue6lhuunqnp87.apps.googleusercontent.com',
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );
    }
    return googleClient;
};

export class UserService {
    /**
     * Register a new user
     */
    static async register(userData: any): Promise<{ user: User, token: string }> {
        try {
            const { name, email, password } = userData;

            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const newUser = new UserModel({
                name,
                email,
                password: hashedPassword,
                createdAt: new Date(),
                lastLogin: new Date(),
                isVerified: false,
                verificationToken,
                verificationTokenExpires,
                preferences: {
                    theme: 'auto',
                    notificationsEnabled: true,
                    workHoursStart: 9,
                    workHoursEnd: 17,
                    focusTimeGoal: 120
                },
            });

            await newUser.save();
            await this.seedInitialData(newUser.id);

            // Send verification email
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
            MailService.sendVerificationEmail(email, verificationLink).catch(err =>
                console.error('Failed to send verification email:', err)
            );

            const userJson = newUser.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error registering user:', error.message);
            throw error;
        }
    }

    /**
     * Login user
     */
    static async login(credentials: any): Promise<{ user: User, token: string }> {
        try {
            const { email, password } = credentials;

            const user = await UserModel.findOne({ email });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            if (user.password && !user.isVerified) {
                throw new Error('Please verify your email before logging in');
            }

            const isMatch = await bcrypt.compare(password, user.password as string);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            user.lastLogin = new Date();
            await user.save();

            const userJson = user.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error logging in:', error.message);
            throw error;
        }
    }

    /**
     * Verify Email
     */
    static async verifyEmail(token: string): Promise<boolean> {
        try {
            const user = await UserModel.findOne({
                verificationToken: token,
                verificationTokenExpires: { $gt: new Date() }
            });

            if (!user) {
                throw new Error('Invalid or expired verification token');
            }

            user.isVerified = true;
            user.verificationToken = undefined;
            user.verificationTokenExpires = undefined;
            await user.save();

            return true;
        } catch (error: any) {
            console.error('Email verification error:', error.message);
            throw error;
        }
    }

    /**
     * Request Password Reset
     */
    static async requestPasswordReset(email: string): Promise<void> {
        try {
            const user = await UserModel.findOne({ email });
            if (!user) {
                // Return silently to prevent email enumeration
                return;
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour

            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetExpires;
            await user.save();

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
            await MailService.sendPasswordResetEmail(email, resetLink);
        } catch (error: any) {
            console.error('Password reset request error:', error.message);
            throw error;
        }
    }

    /**
     * Reset Password
     */
    static async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const user = await UserModel.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: new Date() }
            });

            if (!user) {
                throw new Error('Invalid or expired reset token');
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.isVerified = true; // If they could reset password via email, they are verified
            await user.save();
        } catch (error: any) {
            console.error('Password reset error:', error.message);
            throw error;
        }
    }

    /**
     * Google Login
     */
    static async googleLogin(code: string): Promise<{ user: User, token: string }> {
        try {
            console.log('--- Google Login Attempt ---');
            console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'MISSING (using fallback)');
            console.log('Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'MISSING');
            console.log('Exchanging auth code...');

            const client = getGoogleClient();
            const { tokens } = await client.getToken(code);
            client.setCredentials(tokens);

            console.log('Verifying Google ID token...');
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token!,
                audience: process.env.GOOGLE_CLIENT_ID || '636666241864-fronahev0ijj9vr0a0lue6lhuunqnp87.apps.googleusercontent.com',
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error('Invalid Google token');
            }

            const { email, name, picture } = payload;

            let user = await UserModel.findOne({ email });

            const googleIntegration = {
                connected: true,
                lastSync: new Date(),
                email: email,
                accessToken: tokens.access_token || undefined,
                refreshToken: tokens.refresh_token || undefined
            };

            if (!user) {
                // Create new user if doesn't exist
                user = new UserModel({
                    name: name || 'Google User',
                    email,
                    avatar: picture,
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    isVerified: true, // Google users are verified by default
                    preferences: {
                        theme: 'auto',
                        notificationsEnabled: true,
                        workHoursStart: 9,
                        workHoursEnd: 17,
                        focusTimeGoal: 120
                    },
                    integrations: {
                        google: googleIntegration
                    }
                });
                await user.save();
                await this.seedInitialData(user.id);
            } else {
                user.lastLogin = new Date();
                if (picture) user.avatar = picture;
                user.isVerified = true;
                if (!user.integrations) {
                    user.integrations = {
                        google: googleIntegration
                    };
                } else {
                    user.integrations.google = {
                        ...user.integrations.google,
                        ...googleIntegration,
                        // Preserve refresh token if new one is not provided (Google only sends it on first consent)
                        refreshToken: tokens.refresh_token || user.integrations.google?.refreshToken
                    };
                }
                await user.save();
            }

            const userJson = user.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error with Google Login:', error.message);
            throw error;
        }
    }

    /**
     * Microsoft Login
     */
    static async microsoftLogin(accessToken: string): Promise<{ user: User, token: string }> {
        try {
            // Fetch user info from Microsoft Graph API
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user from Microsoft');
            }

            const data: any = await response.json();
            const { mail, userPrincipalName, displayName } = data;
            const email = mail || userPrincipalName;

            if (!email) {
                throw new Error('No email found in Microsoft account');
            }

            let user = await UserModel.findOne({ email });

            if (!user) {
                user = new UserModel({
                    name: displayName || 'Microsoft User',
                    email,
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    preferences: {
                        theme: 'auto',
                        notificationsEnabled: true,
                        workHoursStart: 9,
                        workHoursEnd: 17,
                        focusTimeGoal: 120
                    },
                });
                await user.save();
                await this.seedInitialData(user.id);
            } else {
                user.lastLogin = new Date();
                await user.save();
            }

            const userJson = user.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error with Microsoft Login:', error.message);
            throw error;
        }
    }

    private static generateToken(userId: string): string {
        const secret = process.env.JWT_SECRET || 'your-default-jwt-secret';
        return jwt.sign({ id: userId }, secret, { expiresIn: '30d' });
    }

    /**
     * Create a new user (Legacy/Fallback)
     */
    static async createUser(user: Partial<User> & { id: string }): Promise<User> {
        try {
            let existingUser = await UserModel.findOne({ $or: [{ _id: user.id }, { email: user.email }] });

            if (existingUser) {
                existingUser.lastLogin = new Date();
                await existingUser.save();
                return existingUser.toJSON() as unknown as User;
            }

            const newUser = new UserModel({
                _id: user.id,
                name: user.name || 'Unknown User',
                email: user.email || '',
                avatar: user.avatar,
                createdAt: new Date(),
                lastLogin: new Date(),
                preferences: {
                    theme: 'auto',
                    notificationsEnabled: true,
                    workHoursStart: 9,
                    workHoursEnd: 17,
                    focusTimeGoal: 120
                },
            });

            await newUser.save();

            // Seed initial data for new users
            await this.seedInitialData(user.id);

            return newUser.toJSON() as unknown as User;
        } catch (error: any) {
            console.error('Error creating user in MongoDB:', error.message);
            throw error;
        }
    }

    private static async seedInitialData(userId: string) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        // Seed Threads
        const threadsData = [
            {
                userId,
                title: 'Q4 Strategic Planning',
                description: 'Finalizing budget and objectives for Q4',
                priority: 'high',
                progress: 35,
                lastActivity: now,
                deadline: new Date(now.getFullYear(), now.getMonth() + 1, 15),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['Sarah Chen', 'Mike Ross'],
                tags: ['Strategy', 'Finance']
            },
            {
                userId,
                title: 'Product Launch: Horizon v2',
                description: 'Coordination for upcoming major release',
                priority: 'high',
                progress: 75,
                lastActivity: yesterday,
                deadline: new Date(now.getFullYear(), now.getMonth(), 28),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['Dev Team', 'Marketing'],
                tags: ['Product', 'Launch']
            },
            {
                userId,
                title: 'Team Performance Reviews',
                description: 'Annual performance evaluation cycle',
                priority: 'medium',
                progress: 10,
                lastActivity: new Date(now.getTime() - 86400000 * 3), // 3 days ago
                deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['HR'],
                tags: ['HR', 'Management']
            }
        ];

        for (const threadData of threadsData) {
            const newThread = new WorkThreadModel({
                ...threadData,
                createdAt: now,
                updatedAt: now,
            });
            await newThread.save();

            // Seed items for this thread
            if (threadData.title === 'Q4 Strategic Planning') {
                const newItem = new WorkItemModel({
                    userId,
                    threadId: newThread.id,
                    type: 'email',
                    title: 'Budget Approval Request',
                    source: 'Gmail',
                    preview: 'Hi Team, please review the attached budget proposal for Q4.',
                    isRead: false,
                    timestamp: now,
                    metadata: {
                        url: 'https://mail.google.com',
                        priority: 'high'
                    }
                });
                await newItem.save();
            }
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        const user = await UserModel.findById(userId);
        return user ? (user.toJSON() as unknown as User) : null;
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        return user ? (user.toJSON() as unknown as User) : null;
    }

    /**
     * Update user
     */
    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            ...updates,
            updatedAt: new Date()
        });
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, { preferences });
    }

    /**
     * Delete user
     */
    static async deleteUser(userId: string): Promise<void> {
        await UserModel.findByIdAndDelete(userId);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            lastLogin: new Date()
        });
    }
}
