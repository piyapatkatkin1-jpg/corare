import { Router } from 'express';
import { OrdersController } from '../controllers/ordersController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Public recent purchases
router.get('/recent', OrdersController.getRecentPurchases);

// User authenticated
router.post('/purchase', authenticateUser, OrdersController.purchaseProduct);
router.get('/my-orders', authenticateUser, OrdersController.getMyOrders);

// Admin
router.get('/admin', authenticateUser, authenticateAdmin, OrdersController.getAllOrdersAdmin);

export default router;
