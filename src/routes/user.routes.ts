import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-login', UserController.googleLogin);
router.post('/microsoft-login', UserController.microsoftLogin);
router.post('/verify-email', UserController.verifyEmail);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

// Protected routes
router.use(authMiddleware as any);
router.post('/seed', UserController.seedData);
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUser);
router.get('/email/search', UserController.getUserByEmail);
router.put('/:id', UserController.updateUser);
router.put('/:id/preferences', UserController.updatePreferences);
router.delete('/:id', UserController.deleteUser);

export default router;
