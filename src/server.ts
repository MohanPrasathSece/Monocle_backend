import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

import userRoutes from './routes/user.routes';
import threadRoutes from './routes/thread.routes';
import workitemRoutes from './routes/workitem.routes';
import intelligenceRoutes from './routes/intelligence.routes';
import integrationRoutes from './routes/integration.routes';
import teamRoutes from './routes/team.routes';
import { authMiddleware } from './middleware/auth.middleware';

import { connectDB } from './config/database';

// Connect to MongoDB
connectDB();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:5173',
    'https://monocle-frontend-seven.vercel.app',
    process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Monocle Work Intelligence API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/threads', authMiddleware, threadRoutes);
app.use('/api/items', authMiddleware, workitemRoutes);
app.use('/api/intelligence', authMiddleware, intelligenceRoutes);
app.use('/api/integrations', authMiddleware, integrationRoutes);
app.use('/api/teams', authMiddleware, teamRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🔮 Monocle Work Intelligence Backend                ║
║                                                        ║
║   Server running on port ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                                        ║
║                                                        ║
║   Endpoints:                                           ║
║   - Health Check: http://localhost:${PORT}/health       ║
║   - Users API: http://localhost:${PORT}/api/users       ║
║   - Threads API: http://localhost:${PORT}/api/threads   ║
║   - Items API: http://localhost:${PORT}/api/items       ║
║   - Intelligence API: http://localhost:${PORT}/api/intelligence║
║   - Teams API: http://localhost:${PORT}/api/teams       ║
║                                                        ║
║   MongoDB: Connected ✓                                 ║
║   Gemini AI: Enabled ✓                                 ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
