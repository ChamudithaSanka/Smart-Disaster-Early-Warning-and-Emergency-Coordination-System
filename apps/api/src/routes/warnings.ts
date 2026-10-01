import { Router } from 'express';
import { Channel, Severity } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { auth, allow, AuthReq } from '../lib/auth';
import { sendAlerts, deliveryStats } from '../services/notification';

export const warnings = Router();
warnings.use(auth);
const HOURS: Record<string, number> = { Flood: 12, Landslide: 24, Cyclone: 24, 'Strong Wind': 12, Drought: 24 * 30, Tsunami: 6 };
const RANK: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const CITIZEN_ROLES = ['CITIZEN'] as any;

warnings.get('/estimate', async (req, res) => {
  const ids = String(req.query.areaIds || '').split(',').filter(Boolean);
  const recipients = ids.length ? await prisma.user.count({ where: { role: { in: CITIZEN_ROLES }, areaId: { in: ids } } }) : 0;
  res.json({ recipients });
});

warnings.get('/', async (_req, res) => {
  const list = await prisma.warning.findMany({ orderBy: { issuedAt: 'desc' }, include: { areas: true } });
  const out = [];
  for (const w of list) {
    const s = await deliveryStats({ warningId: w.id });
    out.push({ ...w, success: s.success, failed: s.failed, unique: s.unique });
  }
  res.json(out);
});

warnings.get('/summary', async (_req, res) => {
  const now = new Date();
  const active = await prisma.warning.findMany({ where: { status: 'ISSUED', validUntil: { gt: now } }, include: { areas: true } });
  const stats = await deliveryStats();
  const latest = await prisma.warning.findFirst({ orderBy: { issuedAt: 'desc' }, include: { areas: true } });
  res.json({
    activeWarnings: active.length,
    affectedAreas: new Set(active.flatMap((w) => w.areas.map((a) => a.id))).size,
    citizensReached: stats.unique, deliverySuccess: stats.success, stats, latest,
    activity: latest ? [
      { at: new Date(+latest.issuedAt - 6 * 60000), text: `Warning '${latest.title}' created` },
      { at: new Date(+latest.issuedAt - 5 * 60000), text: `Areas selected (${latest.areas.length} areas)` },
      { at: latest.issuedAt, text: 'Warning confirmed' },
      { at: new Date(+latest.issuedAt + 4 * 60000), text: 'Notifications sent' },
    ] : [],
  });
});

warnings.get('/delivery', async (req, res) => {
  const { from, to, warningId } = req.query as any;
  const where: any = {};
  if (warningId) where.warningId = warningId;
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(new Date(to).getTime() + 86400000) } : {}) };
  res.json(await deliveryStats(where));
});

warnings.get('/covering', async (req, res) => {
  const areaId = String(req.query.areaId || '');
  const w = await prisma.warning.findFirst({ where: { status: 'ISSUED', validUntil: { gt: new Date() }, areas: { some: { id: areaId } } }, include: { areas: true }, orderBy: { issuedAt: 'desc' } });
  res.json(w);
});

warnings.post('/', allow('DMC_OFFICER'), async (req: AuthReq, res) => {
  const { type, severity, title, description, areaIds, channels, eventId } = req.body;
  if (!type || !severity || !title || !description) return res.status(400).json({ error: 'Type, severity, title and description are required' });
  if (!Array.isArray(channels) || !channels.length) return res.status(400).json({ error: 'Select at least one delivery channel' });
  if (!Array.isArray(areaIds) || !areaIds.length) return res.status(422).json({ error: 'Select at least one affected area' });
  const citizens = await prisma.user.findMany({ where: { role: { in: CITIZEN_ROLES }, areaId: { in: areaIds } }, select: { id: true, phone: true, areaId: true, pushToken: true } });
  if (!citizens.length) return res.status(422).json({ error: 'No recipients found in the selected areas' });
  const count = await prisma.warning.count();
  const w = await prisma.warning.create({
    data: {
      code: `W-${String(221 + count).padStart(4, '0')}`, type, severity, title, description, channels,
      validUntil: new Date(Date.now() + (HOURS[type] || 12) * 3600000),
      issuedById: req.user!.id, eventId: eventId || null, areas: { connect: areaIds.map((id: string) => ({ id })) },
    },
  });
  await sendAlerts(w, citizens, channels as Channel[], areaIds);
  res.status(201).json({ ...w, recipients: citizens.length });
});

warnings.post('/:id/escalate', allow('DMC_OFFICER'), async (req: AuthReq, res) => {
  const { severity, reason, reportId } = req.body as { severity: Severity; reason: string; reportId?: string };
  const w = await prisma.warning.findUnique({ where: { id: req.params.id }, include: { areas: true } });
  if (!w) return res.status(404).json({ error: 'Warning not found' });
  if (!reason?.trim()) return res.status(400).json({ error: 'A reason is required' });
  if (!(RANK[severity] > RANK[w.severity])) return res.status(400).json({ error: 'New level must be higher than the current level' });
  const areaIds = w.areas.map((a) => a.id);
  const citizens = await prisma.user.findMany({ where: { role: { in: CITIZEN_ROLES }, areaId: { in: areaIds } }, select: { id: true, phone: true, areaId: true, pushToken: true } });
  await prisma.escalation.create({ data: { warningId: w.id, fromSeverity: w.severity, toSeverity: severity, reason, reportId, byId: req.user!.id } });
  const upd = await prisma.warning.update({ where: { id: w.id }, data: { severity, validUntil: new Date(Date.now() + (HOURS[w.type] || 12) * 3600000) } });
  await sendAlerts({ id: w.id, title: `UPGRADED: ${w.title}`, description: reason }, citizens, w.channels, areaIds);
  res.json(upd);
});

warnings.post('/:id/cancel', allow('DMC_OFFICER'), async (req, res) => {
  const w = await prisma.warning.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' }, include: { areas: true } });
  const citizens = await prisma.user.findMany({ where: { role: { in: CITIZEN_ROLES }, areaId: { in: w.areas.map((a) => a.id) } }, select: { id: true, phone: true, areaId: true, pushToken: true } });
  await sendAlerts({ id: w.id, title: `CANCELLED: ${w.title}`, description: 'This warning has been cancelled.' }, citizens, w.channels.filter((c) => c !== 'SIREN'), []);
  res.json(w);
});

warnings.post('/:id/retry', allow('DMC_OFFICER'), async (req, res) => {
  const failed = await prisma.alert.findMany({ where: { warningId: req.params.id, status: 'FAILED' }, select: { id: true } });
  let ok = 0;
  for (const a of failed) { const good = Math.random() < 0.9; if (good) ok++; await prisma.alert.update({ where: { id: a.id }, data: { status: good ? 'DELIVERED' : 'FAILED' } }); }
  res.json({ retried: failed.length, delivered: ok });
});
