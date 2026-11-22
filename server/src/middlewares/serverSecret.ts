import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function verifyServerSecret(req: Request, res: Response, next: NextFunction) {
  const secretHeader = req.headers['x-server-secret'] as string | undefined;
  const secretQuery = req.query.secret as string | undefined;

  const providedSecret = secretHeader || secretQuery;

  if (!providedSecret || providedSecret !== config.serverSecretKey) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Invalid or missing X-Server-Secret token',
    });
  }

  next();
}
