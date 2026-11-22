import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../prisma';
import { RconService } from '../services/rconService';

export class RedeemController {
  /**
   * Redeem a promotional gift code for Points or In-game items
   */
  public static async redeemCode(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการแลกโค้ด' });
      }

      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'กรุณากรอกโค้ดของขวัญ' });
      }

      const cleanCode = code.trim().toUpperCase();

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
      }

      // 1. Look up redeem code
      const itemCode = await prisma.redeemCode.findUnique({
        where: { code: cleanCode },
      });

      if (!itemCode || !itemCode.isActive) {
        return res.status(404).json({ error: 'โค้ดนี้ไม่ถูกต้อง หรือถูกปิดการใช้งานแล้ว' });
      }

      // 2. Check expiration date
      if (itemCode.expiresAt && itemCode.expiresAt < new Date()) {
        return res.status(400).json({ error: 'โค้ดนี้หมดอายุการใช้งานแล้ว' });
      }

      // 3. Check usage limit
      if (itemCode.usedCount >= itemCode.maxUses) {
        return res.status(400).json({ error: 'โค้ดนี้ถูกใช้งานครบจำนวนสิทธิ์แล้ว' });
      }

      // 4. Check if user already redeemed this code
      const alreadyRedeemed = await prisma.codeRedemption.findFirst({
        where: {
          codeId: itemCode.id,
          userId: user.id,
        },
      });

      if (alreadyRedeemed) {
        return res.status(400).json({ error: 'คุณได้ใช้สิทธิ์แลกโค้ดนี้ไปแล้ว (1 บัญชีต่อ 1 สิทธิ์)' });
      }

      // 5. Grant rewards
      let rewardSummary = '';
      let remainingBalance = user.balance;

      if (itemCode.type === 'POINTS' && itemCode.pointReward > 0) {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { balance: { increment: itemCode.pointReward } },
        });
        remainingBalance = updated.balance;
        rewardSummary = `${itemCode.pointReward} Points`;
      } else if (itemCode.type === 'COMMAND' && itemCode.commandReward) {
        let commandsList: string[] = [];
        try {
          commandsList = JSON.parse(itemCode.commandReward);
        } catch {
          commandsList = [itemCode.commandReward];
        }

        // Try RCON
        const rconRes = await RconService.executeCommands(commandsList, {
          username: user.username,
          uuid: user.uuid,
        });

        // Also add to CommandQueue
        for (const rawCmd of commandsList) {
          let cmd = rawCmd.replace(/%player%/g, user.username);
          if (user.uuid) cmd = cmd.replace(/%uuid%/g, user.uuid);

          // Get default server or first server
          const defaultServer = await prisma.gameServer.findFirst();
          if (defaultServer) {
            await prisma.commandQueue.create({
              data: {
                serverId: defaultServer.id,
                playerUsername: user.username,
                playerUuid: user.uuid,
                command: cmd,
                status: rconRes.success ? 'EXECUTED' : 'PENDING',
                executedAt: rconRes.success ? new Date() : null,
              },
            });
          }
        }

        rewardSummary = `แพ็กเกจไอเทมในเกม (${commandsList.length} รายการ)`;
      }

      // Increment usedCount & record redemption
      await prisma.$transaction([
        prisma.redeemCode.update({
          where: { id: itemCode.id },
          data: { usedCount: { increment: 1 } },
        }),
        prisma.codeRedemption.create({
          data: {
            codeId: itemCode.id,
            userId: user.id,
            rewardSummary,
          },
        }),
      ]);

      console.log(`🎁 [Redeem] User "${user.username}" redeemed code "${cleanCode}" -> ${rewardSummary}`);

      return res.json({
        success: true,
        message: `แลกโค้ดสำเร็จ! คุณได้รับ: ${rewardSummary}`,
        rewardType: itemCode.type,
        rewardSummary,
        newBalance: remainingBalance,
      });
    } catch (err: any) {
      console.error('Error redeeming code:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแลกโค้ด' });
    }
  }

  /**
   * Get user's redeemed codes
   */
  public static async getMyRedemptions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
      }

      const redemptions = await prisma.codeRedemption.findMany({
        where: { userId: req.user.id },
        include: {
          code: { select: { code: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ redemptions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ================= Admin Endpoints =================

  public static async getAdminCodes(req: any, res: Response) {
    try {
      const codes = await prisma.redeemCode.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { redemptions: true } },
        },
      });
      return res.json({ codes });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async createCode(req: any, res: Response) {
    try {
      const { code, type, pointReward, commandReward, maxUses, expiresAt, isActive } = req.body;

      const newCode = await prisma.redeemCode.create({
        data: {
          code: code.trim().toUpperCase(),
          type: type || 'POINTS',
          pointReward: pointReward ? parseInt(pointReward, 10) : 0,
          commandReward: typeof commandReward === 'string' ? commandReward : JSON.stringify(commandReward || []),
          maxUses: maxUses ? parseInt(maxUses, 10) : 1,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return res.json({ success: true, code: newCode });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteCode(req: any, res: Response) {
    try {
      const { id } = req.params;
      await prisma.redeemCode.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
