import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Protect all admin routes
router.use(authenticateUser, authenticateAdmin);

router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/linking-logs', AdminController.getLinkingLogs);
router.post('/rcon-test', AdminController.testRconCommand);
router.get('/users', AdminController.getUsers);
router.post('/users/adjust-balance', AdminController.adjustUserBalance);

export default router;
