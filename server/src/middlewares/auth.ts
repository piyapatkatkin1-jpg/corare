import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    uuid?: string | null;
  };
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; username: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, uuid: true, balance: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'โทเค็นไม่ถูกต้องหรือหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่' });
  }
}

export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น' });
  }
  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; username: string; role: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true, uuid: true, balance: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore optional auth error
  }
  next();
}
