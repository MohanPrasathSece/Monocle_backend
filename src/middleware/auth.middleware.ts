import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        name?: string;
        picture?: string;
    };
}

/**
 * Middleware to verify JWT Token
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7);

    try {
        const secret = process.env.JWT_SECRET || 'your-default-jwt-secret';
        const decoded = jwt.verify(token, secret) as any;

        // Token is valid
        req.user = {
            id: decoded.id,
        };

        next();
    } catch (error: any) {
        console.error('Authentication failed:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}
