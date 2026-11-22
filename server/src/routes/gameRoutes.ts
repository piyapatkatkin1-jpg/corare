import { Router } from 'express';
import { GameLinkController } from '../controllers/gameLinkController';
import { GameQueueController } from '../controllers/gameQueueController';
import { verifyServerSecret } from '../middlewares/serverSecret';

const router = Router();

// Minecraft Server / Skript Endpoints (Protected by X-Server-Secret)
router.post('/link-account', verifyServerSecret, GameLinkController.verifyInGameLink);
router.post('/link', verifyServerSecret, GameLinkController.verifyInGameLink);

// In-game command queue polling
router.get('/queue', verifyServerSecret, GameQueueController.getPendingCommands);
router.post('/queue/complete', verifyServerSecret, GameQueueController.markCommandCompleted);

export default router;
