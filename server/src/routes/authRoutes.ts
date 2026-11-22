import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

// Account Linking Flow
router.post('/link/request', AuthController.requestLink);
router.get('/link/status/:code', AuthController.checkLinkStatus);
router.post('/link/simulate', AuthController.simulateInGameLink);

// Auth & User Profile
router.post('/admin/login', AuthController.adminLogin);
router.get('/me', authenticateUser, AuthController.getMe);

export default router;
