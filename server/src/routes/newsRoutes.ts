import { Router } from 'express';
import { NewsController } from '../controllers/newsController';
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

const router = Router();

// Promotions
router.get('/promotions', NewsController.getPromotions);
router.get('/promotions/admin', authenticateUser, authenticateAdmin, NewsController.getAllPromotionsAdmin);
router.post('/promotions', authenticateUser, authenticateAdmin, NewsController.createPromotion);
router.put('/promotions/:id', authenticateUser, authenticateAdmin, NewsController.updatePromotion);
router.delete('/promotions/:id', authenticateUser, authenticateAdmin, NewsController.deletePromotion);

// News
router.get('/news', NewsController.getNews);
router.get('/news/:id', NewsController.getNewsById);
router.post('/news', authenticateUser, authenticateAdmin, NewsController.createNews);
router.put('/news/:id', authenticateUser, authenticateAdmin, NewsController.updateNews);
router.delete('/news/:id', authenticateUser, authenticateAdmin, NewsController.deleteNews);

// Rules
router.get('/rules', NewsController.getRules);
router.post('/rules', authenticateUser, authenticateAdmin, NewsController.createRule);
router.delete('/rules/:id', authenticateUser, authenticateAdmin, NewsController.deleteRule);

export default router;
