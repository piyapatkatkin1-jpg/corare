import { Request, Response } from 'express';
import prisma from '../prisma';

export class GameQueueController {
  /**
   * Endpoint for in-game plugin or Skript (delivery.sk) to poll pending commands
   * GET /api/game/queue?serverSlug=mmo
   * Headers: X-Server-Secret: <SECRET>
   */
  public static async getPendingCommands(req: Request, res: Response) {
    try {
      const { serverSlug } = req.query;

      const whereClause: any = { status: 'PENDING' };

      if (serverSlug && typeof serverSlug === 'string') {
        const server = await prisma.gameServer.findUnique({
          where: { slug: serverSlug },
        });
        if (server) {
          whereClause.serverId = server.id;
        }
      }

      const pending = await prisma.commandQueue.findMany({
        where: whereClause,
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      return res.json({
        success: true,
        count: pending.length,
        commands: pending.map((item) => ({
          id: item.id,
          player: item.playerUsername,
          uuid: item.playerUuid,
          command: item.command,
        })),
      });
    } catch (err: any) {
      console.error('Error fetching game queue:', err);
      return res.status(500).json({ error: 'Server error fetching command queue' });
    }
  }

  /**
   * Confirm command execution from in-game script
   * POST /api/game/queue/complete
   * Headers: X-Server-Secret: <SECRET>
   * Body: { queueId: string, status: 'EXECUTED' | 'FAILED' }
   */
  public static async markCommandCompleted(req: Request, res: Response) {
    try {
      const { queueId, status = 'EXECUTED' } = req.body;

      if (!queueId) {
        return res.status(400).json({ error: 'Missing queueId' });
      }

      await prisma.commandQueue.update({
        where: { id: queueId },
        data: {
          status: status === 'FAILED' ? 'FAILED' : 'EXECUTED',
          executedAt: new Date(),
        },
      });

      return res.json({ success: true, message: `Command queue item marked as ${status}` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
