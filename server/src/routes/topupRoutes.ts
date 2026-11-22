import { Router } from 'express';
import { TopupController } from '../controllers/topupController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Public / User
router.get('/packages', TopupController.getPackages);
router.post('/voucher', authenticateUser, TopupController.redeemVoucher);
router.post('/promptpay/create', authenticateUser, TopupController.createPromptPayQr);
router.post('/promptpay/confirm', authenticateUser, TopupController.confirmPromptPay);
router.post('/test', authenticateUser, TopupController.testTopup);
router.post('/webhook', TopupController.paymentWebhook);
router.get('/history', authenticateUser, TopupController.getMyHistory);

// Admin
router.get('/admin', authenticateUser, authenticateAdmin, TopupController.getAllTopupsAdmin);

export default router;
