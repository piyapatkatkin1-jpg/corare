import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../prisma';
import { TruemoneyService } from '../services/truemoneyService';
import { generatePromptPayPayload, getPromptPayQrImageUrl } from '../utils/promptpay';

export const TOPUP_PACKAGES = [
  { amount: 50, basePoints: 50, bonusPoints: 3, totalPoints: 53, popular: false, tag: '+5% Bonus' },
  { amount: 100, basePoints: 100, bonusPoints: 10, totalPoints: 110, popular: true, tag: '+10% Bonus' },
  { amount: 300, basePoints: 300, bonusPoints: 45, totalPoints: 345, popular: false, tag: '+15% Bonus' },
  { amount: 500, basePoints: 500, bonusPoints: 100, totalPoints: 600, popular: true, tag: '+20% Bonus' },
  { amount: 1000, basePoints: 1000, bonusPoints: 250, totalPoints: 1250, popular: false, tag: 'คุ้มสุด! +25%' },
];

export class TopupController {
  /**
   * Get available top-up packages & payment settings
   */
  public static async getPackages(req: any, res: Response) {
    try {
      const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
      return res.json({
        packages: TOPUP_PACKAGES,
        settings: {
          promptpayEnabled: settings?.promptpayEnabled !== undefined ? settings.promptpayEnabled : true,
          promptpayNumber: settings?.promptpayNumber || '0812345678',
          promptpayName: settings?.promptpayName || 'corarevanilla Store',
          truemoneyPhone: settings?.truemoneyPhone || '0812345678',
        },
      });
    } catch {
      return res.json({ packages: TOPUP_PACKAGES });
    }
  }

  /**
   * Create PromptPay QR Code for payment
   */
  public static async createPromptPayQr(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน' });
      }

      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
      }

      const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
      const promptpayNumber = settings?.promptpayNumber || '0812345678';
      const promptpayName = settings?.promptpayName || 'corarevanilla Store';

      const pointsData = TruemoneyService.calculatePoints(numAmount);
      const promptpayPayload = generatePromptPayPayload(promptpayNumber, numAmount);
      const qrImageUrl = getPromptPayQrImageUrl(promptpayPayload, 300);
      const transactionId = `PP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Create pending transaction
      await prisma.topupTransaction.create({
        data: {
          transactionId,
          userId: req.user.id,
          method: 'PROMPTPAY_QR',
          amount: numAmount,
          pointsCredited: pointsData.totalPoints,
          bonusPoints: pointsData.bonusPoints,
          status: 'PENDING',
          reference: `PromptPay QR (${promptpayNumber})`,
        },
      });

      return res.json({
        success: true,
        transactionId,
        amount: numAmount,
        pointsData,
        promptpayPayload,
        qrImageUrl,
        recipient: {
          number: promptpayNumber,
          name: promptpayName,
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      console.error('Error creating PromptPay QR:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง QR Code พร้อมเพย์' });
    }
  }

  /**
   * Confirm PromptPay payment (User or Simulation)
   */
  public static async confirmPromptPay(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
      }

      const { transactionId } = req.body;
      if (!transactionId) {
        return res.status(400).json({ error: 'กรุณาระบุรหัสธุรกรรม' });
      }

      const tx = await prisma.topupTransaction.findUnique({
        where: { transactionId },
      });

      if (!tx || tx.userId !== req.user.id) {
        return res.status(404).json({ error: 'ไม่พบรายการธุรกรรมนี้' });
      }

      if (tx.status === 'SUCCESS') {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        return res.json({
          success: true,
          message: 'รายการนี้ได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว',
          newBalance: user?.balance || 0,
        });
      }

      // Mark success & credit balance
      const result = await prisma.$transaction(async (prismaTx) => {
        const updatedTx = await prismaTx.topupTransaction.update({
          where: { transactionId },
          data: { status: 'SUCCESS' },
        });

        const updatedUser = await prismaTx.user.update({
          where: { id: req.user!.id },
          data: { balance: { increment: tx.pointsCredited } },
        });

        return { updatedTx, updatedUser };
      });

      console.log(`💰 [PromptPay] User "${req.user.username}" paid ฿${tx.amount} -> +${tx.pointsCredited} Points`);

      return res.json({
        success: true,
        message: `เติมเงินผ่านพร้อมเพย์สำเร็จ ฿${tx.amount.toLocaleString()} ได้รับ ${tx.pointsCredited.toLocaleString()} Points!`,
        amount: tx.amount,
        pointsAdded: tx.pointsCredited,
        bonusPoints: tx.bonusPoints,
        newBalance: result.updatedUser.balance,
      });
    } catch (err: any) {
      console.error('Error confirming PromptPay:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน' });
    }
  }

  /**
   * Instant Test Top-up for Sandbox / Dev Testing
   */
  public static async testTopup(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน' });
      }

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: ฟังก์ชันทดสอบเติมเงินสำหรับผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'กรุณาระบุจำนวนเงินที่ต้องการทดสอบเติม' });
      }

      const pointsData = TruemoneyService.calculatePoints(numAmount);
      const transactionId = `TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const result = await prisma.$transaction(async (tx) => {
        const topup = await tx.topupTransaction.create({
          data: {
            transactionId,
            userId: req.user!.id,
            method: 'TEST_SANDBOX',
            amount: numAmount,
            pointsCredited: pointsData.totalPoints,
            bonusPoints: pointsData.bonusPoints,
            status: 'SUCCESS',
            voucherCode: `TEST_${numAmount}`,
            reference: 'จำลองการเติมเงินทดสอบ (Sandbox)',
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: req.user!.id },
          data: { balance: { increment: pointsData.totalPoints } },
        });

        return { topup, updatedUser };
      });

      console.log(`🧪 [Test Topup] User "${req.user.username}" credited ฿${numAmount} -> +${pointsData.totalPoints} Points`);

      return res.json({
        success: true,
        message: `[ระบบทดสอบ] เติมเงินสำเร็จ ฿${numAmount.toLocaleString()} ได้รับ Point ทั้งสิ้น ${pointsData.totalPoints.toLocaleString()} Points (รวมโบนัส +${pointsData.bonusPoints} P)!`,
        amount: numAmount,
        pointsAdded: pointsData.totalPoints,
        bonusPoints: pointsData.bonusPoints,
        newBalance: result.updatedUser.balance,
      });
    } catch (err: any) {
      console.error('Error test topup:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเติมเงินทดสอบ' });
    }
  }

  /**
   * Top-up via TrueMoney Gift Voucher (ซองของขวัญ / อั่งเปา)
   */
  public static async redeemVoucher(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน' });
      }

      const { voucherUrl } = req.body;
      if (!voucherUrl || typeof voucherUrl !== 'string') {
        return res.status(400).json({ error: 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
      }

      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // 1. Process voucher via service
      const result = await TruemoneyService.redeemVoucher(voucherUrl);

      if (!result.success) {
        // Record failed transaction log
        await prisma.topupTransaction.create({
          data: {
            transactionId,
            userId: user.id,
            method: 'TRUEMONEY_VOUCHER',
            amount: 0,
            pointsCredited: 0,
            bonusPoints: 0,
            status: 'FAILED',
            voucherCode: result.voucherCode,
            reference: result.message,
          },
        });

        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }

      // 2. Calculate points and bonuses
      const pointsData = TruemoneyService.calculatePoints(result.amount);

      // 3. Update user balance & save successful transaction
      const transaction = await prisma.$transaction(async (tx) => {
        const topup = await tx.topupTransaction.create({
          data: {
            transactionId,
            userId: user.id,
            method: result.voucherCode.startsWith('TEST_') ? 'TEST_SANDBOX' : 'TRUEMONEY_VOUCHER',
            amount: result.amount,
            pointsCredited: pointsData.totalPoints,
            bonusPoints: pointsData.bonusPoints,
            status: 'SUCCESS',
            voucherCode: result.voucherCode,
            reference: result.message,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            balance: { increment: pointsData.totalPoints },
          },
        });

        return { topup, updatedUser };
      });

      console.log(`💰 [Topup] User "${user.username}" topped up ${result.amount} THB -> ${pointsData.totalPoints} Points`);

      return res.json({
        success: true,
        message: `เติมเงินสำเร็จ ${result.amount} บาท ได้รับ Point ทั้งสิ้น ${pointsData.totalPoints} Points (รวมโบนัส ${pointsData.bonusPoints} Points)!`,
        amount: result.amount,
        pointsAdded: pointsData.totalPoints,
        bonusPoints: pointsData.bonusPoints,
        newBalance: transaction.updatedUser.balance,
      });
    } catch (err: any) {
      console.error('Error redeeming voucher:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลการเติมเงิน' });
    }
  }

  /**
   * Top-up Webhook for automated payment callbacks (e.g. Payment Gateway / Slip QR)
   */
  public static async paymentWebhook(req: any, res: Response) {
    try {
      const { transactionId, status, amount, userId, secret } = req.body;

      if (secret !== process.env.SERVER_SECRET_KEY) {
        return res.status(403).json({ error: 'Unauthorized webhook' });
      }

      if (status === 'SUCCESS' && userId && amount) {
        const numAmount = parseFloat(amount);
        const pointsData = TruemoneyService.calculatePoints(numAmount);

        await prisma.$transaction(async (tx) => {
          await tx.topupTransaction.create({
            data: {
              transactionId: transactionId || `WH-${Date.now()}`,
              userId,
              method: 'TRUEMONEY_WEBHOOK',
              amount: numAmount,
              pointsCredited: pointsData.totalPoints,
              bonusPoints: pointsData.bonusPoints,
              status: 'SUCCESS',
              reference: 'Webhook Verified Payment',
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: pointsData.totalPoints } },
          });
        });

        return res.json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid webhook payload' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * User's topup history
   */
  public static async getMyHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
      }

      const history = await prisma.topupTransaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return res.json({ history });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลประวัติการเติมเงินได้' });
    }
  }

  /**
   * Admin: View all topup transactions
   */
  public static async getAllTopupsAdmin(req: any, res: Response) {
    try {
      const { search, status, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { transactionId: { contains: search } },
          { user: { username: { contains: search } } },
        ];
      }

      const [total, transactions] = await Promise.all([
        prisma.topupTransaction.count({ where }),
        prisma.topupTransaction.findMany({
          where,
          include: {
            user: { select: { username: true, uuid: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string, 10),
        }),
      ]);

      return res.json({ total, transactions, page: parseInt(page as string, 10) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
