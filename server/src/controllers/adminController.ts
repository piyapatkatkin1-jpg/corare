import { Request, Response } from 'express';
import prisma from '../prisma';
import { RconService } from '../services/rconService';

export class AdminController {
  /**
   * Overall dashboard metrics and revenue statistics
   */
  public static async getDashboardStats(req: Request, res: Response) {
    try {
      const [
        totalUsers,
        totalOrders,
        totalTopups,
        recentOrders,
        topupStats,
        pendingQueues,
        linkingStats,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.topupTransaction.count({ where: { status: 'SUCCESS' } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true, uuid: true } },
            items: true,
          },
        }),
        prisma.topupTransaction.aggregate({
          where: { status: 'SUCCESS' },
          _sum: {
            amount: true,
            pointsCredited: true,
          },
        }),
        prisma.commandQueue.count({ where: { status: 'PENDING' } }),
        prisma.linkLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const totalRevenueBaht = topupStats._sum.amount || 0;
      const totalPointsIssued = topupStats._sum.pointsCredited || 0;

      return res.json({
        stats: {
          totalUsers,
          totalOrders,
          totalSuccessfulTopups: totalTopups,
          totalRevenueBaht,
          totalPointsIssued,
          pendingCommands: pendingQueues,
        },
        recentOrders,
        recentLinkingLogs: linkingStats,
      });
    } catch (err: any) {
      console.error('Error getting dashboard stats:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดสถิติ' });
    }
  }

  /**
   * View Account Linking Security Logs (Detect brute-force or spoofing)
   */
  public static async getLinkingLogs(req: Request, res: Response) {
    try {
      const { search, page = '1', limit = '30' } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

      const where: any = {};
      if (search && typeof search === 'string') {
        where.OR = [
          { username: { contains: search } },
          { code: { contains: search } },
          { ipAddress: { contains: search } },
        ];
      }

      const [total, logs] = await Promise.all([
        prisma.linkLog.count({ where }),
        prisma.linkLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string, 10),
        }),
      ]);

      return res.json({ total, logs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Test RCON command directly from Admin Dashboard
   */
  public static async testRconCommand(req: Request, res: Response) {
    try {
      const { command, serverId } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'กรุณากรอกคำสั่งที่ต้องการทดสอบ' });
      }

      let options: any = undefined;
      if (serverId) {
        const server = await prisma.gameServer.findUnique({ where: { id: serverId } });
        if (server && server.rconHost && server.rconPassword) {
          options = {
            host: server.rconHost,
            port: server.rconPort,
            password: server.rconPassword,
          };
        }
      }

      const result = await RconService.executeCommands(
        [command],
        { username: 'Console', uuid: null },
        options
      );

      return res.json({
        success: result.success,
        output: result.results.join('\n'),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get all users for admin
   */
  public static async getUsers(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const where: any = {};
      if (search && typeof search === 'string') {
        where.username = { contains: search };
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          uuid: true,
          role: true,
          balance: true,
          totalSpent: true,
          isLinked: true,
          linkedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.json({ users });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Adjust user points balance
   */
  public static async adjustUserBalance(req: Request, res: Response) {
    try {
      const { userId, amount, reason } = req.body;
      const numAmount = parseInt(amount, 10);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: numAmount },
        },
      });

      console.log(`🔧 [Admin] Adjusted points for user ${user.username}: ${numAmount} (${reason || 'Admin manual adjustment'})`);

      return res.json({ success: true, newBalance: user.balance });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
