import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { auth, sign, AuthReq } from '../lib/auth';

export const authRouter = Router();
const pub = (u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, language: u.language, areaId: u.areaId, centreId: u.centreId, teamId: u.teamId, orgId: u.orgId });

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = await prisma.user.findUnique({ where: { email: String(email || '').toLowerCase() } });
  if (!u || !(await bcrypt.compare(String(password || ''), u.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(u), user: pub(u) });
});

authRouter.get('/me', auth, async (req: AuthReq, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(pub(u));
});

authRouter.post('/push-token', auth, async (req: AuthReq, res) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { pushToken: req.body.token } });
  res.json({ ok: true });
});
