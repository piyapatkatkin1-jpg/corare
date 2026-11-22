import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { config } from '../config';
import { generateSecureCode } from '../utils/cryptoUtils';
import { AuthRequest } from '../middlewares/auth';
import { getFirestoreDb } from '../services/firebaseService';

export class AuthController {
  /**
   * Step 1: User enters Minecraft username on web.
   * Generates a 5-character cryptographically secure code valid for 5 minutes.
   */
  public static async requestLink(req: Request, res: Response) {
    try {
      const { username } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อผู้เล่น Minecraft ให้ถูกต้อง (อย่างน้อย 3 ตัวอักษร)' });
      }

      const cleanUsername = username.trim();

      // Check rate limit: Don't allow creating more than 5 codes per username in 5 minutes
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentSessions = await prisma.linkSession.count({
        where: {
          username: cleanUsername,
          createdAt: { gte: fiveMinsAgo },
        },
      });

      if (recentSessions >= 8) {
        return res.status(429).json({ error: 'คุณขอรหัสยืนยันถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง' });
      }

      // Generate unique 5-character code
      let code = '';
      let isUnique = false;
      let retries = 0;

      while (!isUnique && retries < 10) {
        code = generateSecureCode(5);
        const existing = await prisma.linkSession.findUnique({ where: { code } });
        if (!existing) {
          isUnique = true;
        }
        retries++;
      }

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.linkSession.create({
        data: {
          code,
          username: cleanUsername,
          status: 'PENDING',
          ipAddress: ip,
          expiresAt,
        },
      });

      return res.json({
        success: true,
        code,
        username: cleanUsername,
        expiresAt,
        command: `/link ${code}`,
        instruction: `กรุณาเข้าเกม Minecraft แล้วพิมพ์คำสั่ง: /link ${code}`,
      });
    } catch (err: any) {
      console.error('Error requesting link:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างรหัสยืนยัน' });
    }
  }

  /**
   * Step 2: Web frontend polls this endpoint to detect when in-game /link succeeded.
   */
  public static async checkLinkStatus(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ error: 'ไม่พบรหัสยืนยัน' });
      }

      const session = await prisma.linkSession.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!session) {
        return res.status(404).json({ error: 'ไม่พบรหัสยืนยัน หรือรหัสไม่ถูกต้อง' });
      }

      const now = new Date();
      if (session.status === 'PENDING' && session.expiresAt < now) {
        await prisma.linkSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });
        return res.json({ status: 'EXPIRED', message: 'รหัสยืนยันหมดอายุแล้ว กรุณาสร้างรหัสใหม่' });
      }

      if (session.status === 'LINKED') {
        // Fetch or create user record
        const user = await prisma.user.findUnique({
          where: { username: session.username },
        });

        if (!user) {
          return res.status(500).json({ error: 'ไม่พบข้อมูลผู้ใช้ที่ผูกสำเร็จ' });
        }

        // Generate JWT Token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          config.jwtSecret,
          { expiresIn: '7d' }
        );

        return res.json({
          status: 'LINKED',
          message: 'ผูกบัญชีและเข้าสู่ระบบสำเร็จ!',
          token,
          user: {
            id: user.id,
            username: user.username,
            uuid: user.uuid,
            role: user.role,
            balance: user.balance,
          },
        });
      }

      return res.json({
        status: session.status,
        expiresAt: session.expiresAt,
      });
    } catch (err: any) {
      console.error('Error checking link status:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ' });
    }
  }

  /**
   * Dev Sandbox / Test Simulation:
   * Allows testing the link flow directly from web UI when Minecraft server is not running locally.
   */
  public static async simulateInGameLink(req: Request, res: Response) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Missing code' });
      }

      const session = await prisma.linkSession.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!session) {
        return res.status(404).json({ error: 'Code not found' });
      }

      if (session.status !== 'PENDING') {
        return res.status(400).json({ error: `Session already in status: ${session.status}` });
      }

      const simulatedUuid = '069a79f4-44e9-4726-a5be-fca90e38aaf5';

      // Update session
      await prisma.linkSession.update({
        where: { id: session.id },
        data: {
          status: 'LINKED',
          uuid: simulatedUuid,
        },
      });

      // Upsert User
      await prisma.user.upsert({
        where: { username: session.username },
        update: {
          uuid: simulatedUuid,
          isLinked: true,
          linkedAt: new Date(),
        },
        create: {
          username: session.username,
          uuid: simulatedUuid,
          balance: 100, // Welcome points
          isLinked: true,
          linkedAt: new Date(),
        },
      });

      // Log success
      await prisma.linkLog.create({
        data: {
          username: session.username,
          uuid: simulatedUuid,
          code: session.code,
          status: 'SUCCESS (SIMULATED)',
          ipAddress: '127.0.0.1',
          serverIdentifier: 'SIMULATOR',
        },
      });

      return res.json({ success: true, message: 'Simulated in-game link executed successfully!' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Admin Login (Username & Password)
   */
  public static async adminLogin(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านของผู้ดูแลระบบ' });
      }

      let user: { id: string; username: string; role: string; password: string | null } | null = null;
      const fdb = getFirestoreDb();
      if (fdb) {
        const snap = await fdb.collection('admins').where('username', '==', username).limit(1).get();
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          user = { id: `admin:${d.id}`, username: data.username, role: 'ADMIN', password: data.password || null };
        }
      } else {
        user = await prisma.user.findUnique({ where: { username } });
      }

      if (!user || user.role !== 'ADMIN') {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
      }

      if (!user.password) {
        return res.status(401).json({ error: 'บัญชีนี้ยังไม่ได้ตั้งรหัสผ่านสำหรับหลังบ้าน' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: '3d' }
      );

      return res.json({
        success: true,
        token,
        admin: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Error during admin login:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบแอดมิน' });
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  public static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
      });

      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
  }
}
