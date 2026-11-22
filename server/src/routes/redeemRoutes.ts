import { Router } from 'express';
import { RedeemController } from '../controllers/redeemController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// User
router.post('/', authenticateUser, RedeemController.redeemCode);
router.get('/my-redemptions', authenticateUser, RedeemController.getMyRedemptions);

// Admin
router.get('/admin', authenticateUser, authenticateAdmin, RedeemController.getAdminCodes);
router.post('/admin', authenticateUser, authenticateAdmin, RedeemController.createCode);
router.delete('/admin/:id', authenticateUser, authenticateAdmin, RedeemController.deleteCode);

export default router;
