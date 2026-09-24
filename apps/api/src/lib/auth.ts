import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
export const sign = (u: { id: string; role: string }) => jwt.sign(u, SECRET, { expiresIn: '12h' });

export interface AuthReq extends Request { user?: { id: string; role: string } }

export const auth = (req: AuthReq, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(h.slice(7), SECRET) as any; next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

export const allow = (...roles: string[]) => (req: AuthReq, res: Response, next: NextFunction) =>
  roles.includes(req.user!.role) ? next() : res.status(403).json({ error: 'You are not authorized to perform this action' });
