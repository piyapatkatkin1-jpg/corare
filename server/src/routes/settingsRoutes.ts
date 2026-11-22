import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Public
router.get('/public', SettingsController.getPublicSettings);

// Admin
router.get('/admin', authenticateUser, authenticateAdmin, SettingsController.getAdminSettings);
router.put('/admin', authenticateUser, authenticateAdmin, SettingsController.updateSettings);
router.post('/admin/test-rcon', authenticateUser, authenticateAdmin, SettingsController.testRconConnection);
router.post('/admin/rcon-test', authenticateUser, authenticateAdmin, SettingsController.testRconConnection);
router.post('/admin/test-firebase', authenticateUser, authenticateAdmin, SettingsController.testFirebaseConnection);

export default router;
