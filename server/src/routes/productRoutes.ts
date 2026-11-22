import { Router } from 'express';
import { ProductsController } from '../controllers/productsController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Public
router.get('/servers', ProductsController.getServers);
router.get('/servers/:slug', ProductsController.getServerBySlug);
router.get('/products', ProductsController.getProducts);
router.get('/products/:id', ProductsController.getProductById);

// Admin
router.post('/servers', authenticateUser, authenticateAdmin, ProductsController.createServer);
router.put('/servers/:id', authenticateUser, authenticateAdmin, ProductsController.updateServer);
router.delete('/servers/:id', authenticateUser, authenticateAdmin, ProductsController.deleteServer);

router.post('/categories', authenticateUser, authenticateAdmin, ProductsController.createCategory);
router.put('/categories/:id', authenticateUser, authenticateAdmin, ProductsController.updateCategory);
router.delete('/categories/:id', authenticateUser, authenticateAdmin, ProductsController.deleteCategory);

router.post('/products', authenticateUser, authenticateAdmin, ProductsController.createProduct);
router.put('/products/:id', authenticateUser, authenticateAdmin, ProductsController.updateProduct);
router.delete('/products/:id', authenticateUser, authenticateAdmin, ProductsController.deleteProduct);

export default router;
