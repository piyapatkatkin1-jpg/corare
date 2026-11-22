import { Router } from 'express';

// ===== Middleware =====
import { authenticateUser, authenticateAdmin } from '../middlewares/auth';

// ===== Controllers =====
import { AuthController } from '../controllers/AuthController';
import { ServerController } from '../controllers/ServerController';
import { CategoryController } from '../controllers/CategoryController';

// ⚠️ Controller อื่นๆ ที่โปรเจกต์อาจมีอยู่แล้ว — ปลดคอมเมนต์เมื่อมีไฟล์จริง
// import { ProductsController } from '../controllers/ProductsController';
// import { AdminController } from '../controllers/AdminController';
// import { GameLinkController } from '../controllers/GameLinkController';

const router = Router();

// =========================================================
// 🔓 PUBLIC — ไม่ต้อง login
// =========================================================
router.post('/auth/admin-login', AuthController.adminLogin);

// =========================================================
// 🔒 PROTECTED — ต้อง login เป็น ADMIN เท่านั้น
// =========================================================
router.use(authenticateUser, authenticateAdmin);

// ---------- 👤 Profile ----------
router.get('/me', AuthController.getMe);

// =========================================================
// 🖥️ SERVERS (Firestore)
// =========================================================
router.get('/servers', ServerController.list);
router.post('/servers', ServerController.create);
router.put('/servers/:id', ServerController.update);
router.delete('/servers/:id', ServerController.remove);

// =========================================================
// 📂 CATEGORIES (Firestore)
// =========================================================
router.get('/categories', CategoryController.list);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.remove);

// =========================================================
// 🎮 RCON — ทดสอบยิงคำสั่งเข้า Minecraft
// =========================================================
// ⚠️ เปิดใช้เมื่อมี AdminController.testRconCommand หรือเมธอดที่เทียบเท่า
// router.post('/rcon-test', AdminController.testRconCommand);
// router.post('/rcon/execute', AdminController.executeRcon);

// =========================================================
// 🛒 PRODUCTS (ถ้าโปรเจกต์มีอยู่แล้ว)
// =========================================================
// router.get('/products', ProductsController.listAdmin);
// router.post('/products', ProductsController.create);
// router.put('/products/:id', ProductsController.update);
// router.delete('/products/:id', ProductsController.remove);

// =========================================================
// 🔗 ACCOUNT LINK LOGS
// =========================================================
// router.get('/link-logs', GameLinkController.listLogs);
// router.get('/link-sessions', GameLinkController.listSessions);

// =========================================================
// ⚙️ SYSTEM SETTINGS
// =========================================================
// router.get('/settings', AdminController.getSettings);
// router.put('/settings', AdminController.updateSettings);

// =========================================================
// 🎁 REDEEM CODES (ถ้ามี)
// =========================================================
// router.get('/redeem-codes', AdminController.listRedeemCodes);
// router.post('/redeem-codes', AdminController.createRedeemCode);
// router.delete('/redeem-codes/:id', AdminController.deleteRedeemCode);

export default router;
