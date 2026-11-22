import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import topupRoutes from './routes/topupRoutes';
import redeemRoutes from './routes/redeemRoutes';
import newsRoutes from './routes/newsRoutes';
import gameRoutes from './routes/gameRoutes';
import adminRoutes from './routes/adminRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { GameLinkController } from './controllers/gameLinkController';
import { verifyServerSecret } from './middlewares/serverSecret';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow development and custom domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Server-Secret', 'X-Server-Id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    name: 'corarevanilla Store API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Explicit top-level endpoint required in prompt:
// "POST /api/link-account รับ {uuid, username, code}"
app.post('/api/link-account', verifyServerSecret, GameLinkController.verifyInGameLink);

// Mount API routes
app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api', newsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Serve built frontend (client/dist) with SPA fallback
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 corarevanilla Web Store Backend running on:`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔑 Server Secret: ${config.serverSecretKey}`);
  console.log(`🕹️  Minecraft /link endpoint: http://localhost:${PORT}/api/link-account`);
  console.log(`===============================================`);
});
