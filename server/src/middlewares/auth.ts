import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma';
import { getFirestoreDb } from '../services/firebaseService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

/** ตรวจ JWT — ต้อง login (user หรือ admin) */
export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ไม่พบ token กรุณาเข้าสู่ระบบ' });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as {
      id: string;
      username: string;
      role: string;
    };

    // ถ้าเป็น admin จาก Firestore (id ขึ้นต้นด้วย "admin:") ไม่ต้อง query Prisma
    if (payload.id?.startsWith('admin:')) {
      req.user = payload;
      return next();
    }

    // user ปกติ → ตรวจว่ายังมีในระบบ
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: 'ไม่พบผู้ใช้ หรือถูกระงับการใช้งาน' });
    }

    req.user = { id: user.id, username: user.username, role: user.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

/** ต้องเป็น ADMIN เท่านั้น */
export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
  return next();
}
