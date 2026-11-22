import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { initFirebase } from './services/firebaseService';
import { bootstrapDefaultSmpData } from './services/bootstrapService';

// ===== Routes =====
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import linkRoutes from './routes/linkRoutes';

// ⚠️ ถ้ายังไม่มีไฟล์เหล่านี้ ให้คอมเมนต์บรรทัด import + app.use ด้านล่างออกก่อน
// import rconRoutes from './routes/rconRoutes';
// import redeemRoutes from './routes/redeemRoutes';
// import settingsRoutes from './routes/settingsRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// =========================================================
// 🔧 1. SECURITY & PARSING MIDDLEWARE
// =========================================================
app.set('trust proxy', 1); // Railway อยู่หลัง proxy

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, cb) => {
    // อนุญาตทุก origin ใน dev / อนุญาตเฉพาะที่กำหนดใน production
    const allowed = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || [];
    if (
      !origin ||
      allowed.length === 0 ||
      allowed.includes(origin) ||
      allowed.includes('*')
    ) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('short'));

// =========================================================
// 🚦 2. RATE LIMITING (กัน brute force / spam)
// =========================================================
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 นาที
  max: 300,                  // 300 req/นาที
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'คำขอถี่เกินไป กรุณารอสักครู่' },
});
app.use('/api/', globalLimiter);

// login เข้มกว่า
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 นาที
  max: 20,                    // 20 ครั้ง
  message: { error: 'พยายาม login ถี่เกินไป กรุณารอ 5 นาที' },
});
app.use('/api/admin/auth/admin-login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

// =========================================================
// 🏥 3. HEALTH CHECK
// =========================================================
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'corarevanilla-web-store-backend',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// =========================================================
// 🛣️ 4. ROUTES
// =========================================================

// ----- Public auth (login/register/admin-login) -----
app.use('/api/auth', authRoutes);

// ----- Link Minecraft account (in-game plugin เรียก) -----
app.use('/api', linkRoutes);          // → /api/link-account, /api/link/status/:code ฯลฯ

// ----- Product / Shop -----
app.use('/api/products', productRoutes);

// ----- Admin (protected) -----
app.use('/api/admin', adminRoutes);

// ----- Optional routes (คอมเมนต์ถ้ายังไม่มี) -----
// app.use('/api/rcon', rconRoutes);
// app.use('/api/redeem', redeemRoutes);
// app.use('/api/settings', settingsRoutes);

// =========================================================
// ❓ 5. 404 HANDLER (ต้องอยู่หลัง routes ทั้งหมด)
// =========================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'ไม่พบ endpoint นี้',
    path: req.originalUrl,
    method: req.method,
  });
});

// =========================================================
// 💥 6. GLOBAL ERROR HANDLER
// =========================================================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [Unhandled Error]', err);

  // Prisma / Firestore / JWT error mapping
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'เกิดข้อผิดพลาดภายในระบบ'
      : err.message || 'Unknown error';

  res.status(status).json({ error: message });
});

// =========================================================
// 🚀 7. BOOT SEQUENCE
// =========================================================
async function bootstrap() {
  try {
    // ---- 7.1 Firebase ----
    console.log('🔥 Initializing Firebase...');
    await initFirebase();
    console.log('🔥 [Firebase] Ready');

    // ---- 7.2 Seed "smp" server + category ----
    console.log('🌱 Bootstrapping default SMP data...');
    await bootstrapDefaultSmpData();
    console.log('🌱 [Bootstrap] Done');

    // ---- 7.3 (Optional) RCON ----
    if (process.env.RCON_ENABLED === 'true') {
      try {
        // const { initRcon } = await import('./services/rconService');
        // await initRcon();
        console.log('🎮 [RCON] Ready');
      } catch (e) {
        console.warn('⚠️ [RCON] Init failed (non-fatal):', e);
      }
    } else {
      console.warn('ℹ️ [RCON] Disabled (RCON_ENABLED != true)');
    }

    // ---- 7.4 Listen ----
    const server = app.listen(PORT, () => {
      console.log('===============================================');
      console.log('🚀 corarevanilla Web Store Backend running on:');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌍 ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎮 RCON: ${process.env.RCON_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID || '(from service account)'}`);
      console.log('===============================================');
    });

    // ---- 7.5 Graceful shutdown ----
    const shutdown = (sig: string) => {
      console.log(`\n⏹️  Received ${sig}, shutting down gracefully...`);
      server.close(async () => {
        try {
          const prisma = (await import('./prisma')).default;
          await prisma.$disconnect();
        } catch { /* noop */ }
        console.log('✅ Shutdown complete');
        process.exit(0);
      });
      // force exit หลัง 10 วิ
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
    });
  } catch (err) {
    console.error('💥 Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

export default app;
