import { Request, Response } from 'express';
import prisma from '../prisma';

export class GameLinkController {
  /**
   * Endpoint called by in-game Skript (link.sk):
   * POST /api/link-account (or /api/link/verify)
   * Headers: X-Server-Secret: <SECRET_KEY>
   * Body: { uuid: string, username: string, code: string }
   */
  public static async verifyInGameLink(req: Request, res: Response) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const serverIdentifier = (req.headers['x-server-id'] as string) || 'Minecraft Server';

    try {
      const { uuid, username, code } = req.body;

      if (!username || !code) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'ข้อมูลไม่ครบถ้วน (ต้องระบุ username และ code)',
        });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const cleanUsername = String(username).trim();
      const cleanUuid = uuid ? String(uuid).trim() : null;

      // 1. Find the session by code
      const session = await prisma.linkSession.findUnique({
        where: { code: cleanCode },
      });

      // If code doesn't exist at all
      if (!session) {
        await prisma.linkLog.create({
          data: {
            username: cleanUsername,
            uuid: cleanUuid,
            code: cleanCode,
            status: 'FAILED_INVALID_CODE',
            ipAddress: ip,
            serverIdentifier,
          },
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_CODE',
          message: 'รหัสยืนยันไม่ถูกต้อง กรุณาตรวจสอบรหัสบนหน้าเว็บอีกครั้ง',
        });
      }

      // 2. Check failed attempts (Rate limit per session)
      if (session.attempts >= 5) {
        await prisma.linkSession.update({
          where: { id: session.id },
          data: { status: 'FAILED' },
        });

        await prisma.linkLog.create({
          data: {
            username: cleanUsername,
            uuid: cleanUuid,
            code: cleanCode,
            status: 'FAILED_RATE_LIMIT',
            ipAddress: ip,
            serverIdentifier,
          },
        });

        return res.status(429).json({
          success: false,
          error: 'TOO_MANY_ATTEMPTS',
          message: 'รหัสนี้ถูกลองผิดเกิน 5 ครั้งแล้ว รหัสถูกยกเลิกเพื่อความปลอดภัย กรุณาสร้างใหม่บนหน้าเว็บ',
        });
      }

      // 3. Check expiration
      const now = new Date();
      if (session.expiresAt < now || session.status === 'EXPIRED') {
        await prisma.linkSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });

        await prisma.linkLog.create({
          data: {
            username: cleanUsername,
            uuid: cleanUuid,
            code: cleanCode,
            status: 'FAILED_EXPIRED',
            ipAddress: ip,
            serverIdentifier,
          },
        });

        return res.status(400).json({
          success: false,
          error: 'EXPIRED_CODE',
          message: 'รหัสยืนยันนี้หมดอายุแล้ว (อายุ 5 นาที) กรุณากดสร้างรหัสใหม่บนหน้าเว็บ',
        });
      }

      // 4. Check status (single-use check)
      if (session.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'ALREADY_USED',
          message: `รหัสนี้ถูกใช้งานไปแล้ว สถานะปัจจุบัน: ${session.status}`,
        });
      }

      // 5. Verify username matches case-insensitively
      if (session.username.toLowerCase() !== cleanUsername.toLowerCase()) {
        // Increment attempts
        await prisma.linkSession.update({
          where: { id: session.id },
          data: { attempts: { increment: 1 } },
        });

        await prisma.linkLog.create({
          data: {
            username: cleanUsername,
            uuid: cleanUuid,
            code: cleanCode,
            status: 'FAILED_USERNAME_MISMATCH',
            ipAddress: ip,
            serverIdentifier,
          },
        });

        return res.status(400).json({
          success: false,
          error: 'USERNAME_MISMATCH',
          message: `รหัสนี้ถูกสร้างขึ้นสำหรับชื่อ "${session.username}" แต่คุณกำลังใช้ชื่อ "${cleanUsername}" ในเกม`,
        });
      }

      // 6. SUCCESS! Update session and link user
      await prisma.linkSession.update({
        where: { id: session.id },
        data: {
          status: 'LINKED',
          uuid: cleanUuid,
        },
      });

      // Upsert User record
      const updatedUser = await prisma.user.upsert({
        where: { username: session.username },
        update: {
          uuid: cleanUuid || undefined,
          isLinked: true,
          linkedAt: new Date(),
        },
        create: {
          username: session.username,
          uuid: cleanUuid,
          isLinked: true,
          linkedAt: new Date(),
          balance: 0,
        },
      });

      // Record successful link log
      await prisma.linkLog.create({
        data: {
          username: session.username,
          uuid: cleanUuid,
          code: cleanCode,
          status: 'SUCCESS',
          ipAddress: ip,
          serverIdentifier,
        },
      });

      console.log(`🎉 [Account Link] User "${session.username}" linked UUID: ${cleanUuid}`);

      return res.json({
        success: true,
        message: 'ผูกบัญชีเข้ากับหน้าเว็บสำเร็จแล้ว! คุณสามารถกลับไปใช้งานหน้าเว็บต่อได้ทันที',
        user: {
          username: updatedUser.username,
          uuid: updatedUser.uuid,
          balance: updatedUser.balance,
        },
      });
    } catch (err: any) {
      console.error('Error in verifyInGameLink:', err);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์',
      });
    }
  }
}
