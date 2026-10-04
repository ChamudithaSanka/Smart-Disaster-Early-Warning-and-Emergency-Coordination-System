import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { auth, allow, AuthReq } from '../lib/auth';
import { km } from '../lib/geo';

export const rescue = Router();
rescue.use(auth);
const TIMEOUT_MIN = Number(process.env.COORDINATOR_TIMEOUT_MIN || 10);

rescue.get('/requests', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (_q, res) => {
  const order = { HIGH: 0, MED: 1, LOW: 2 } as any;
  const list = await prisma.rescueRequest.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
  res.json(list.sort((a, b) => order[a.priority] - order[b.priority]));
});

// Request + ranked, available candidate teams (declined teams removed automatically)
rescue.get('/requests/:id', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req, res) => {
  const id = Number(req.params.id);
  const request = await prisma.rescueRequest.findUnique({ where: { id }, include: { dispatches: true } });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const declined = new Set(request.dispatches.filter((d) => ['DECLINED', 'TIMED_OUT', 'CANCELLED'].includes(d.status)).map((d) => d.teamId));
  const teams = await prisma.rescueTeam.findMany({ where: { status: 'AVAILABLE' }, include: { org: true } });
  const candidates = teams.filter((t) => !declined.has(t.id)).map((t) => ({ id: t.id, name: t.name, org: t.org.name, lat: t.lat, lng: t.lng, distanceKm: km(t, request) })).sort((a, b) => a.distanceKm - b.distanceKm);
  res.json({ request, candidates });
});

rescue.get('/teams', async (_q, res) => {
  res.json(await prisma.rescueTeam.findMany({ include: { org: true }, orderBy: { name: 'asc' } }));
});

rescue.post('/dispatches', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req: AuthReq, res) => {
  const { requestId, teamId, eta } = req.body;
  const team = await prisma.rescueTeam.findUnique({ where: { id: teamId } });
  if (!team || team.status !== 'AVAILABLE') return res.status(409).json({ error: 'Selected team is no longer available. Please choose another team.' });
  const d = await prisma.dispatch.create({ data: { requestId: Number(requestId), teamId, eta, createdById: req.user!.id } });
  res.status(201).json(d);
});

const full = { request: true, team: { include: { org: true } }, logs: { orderBy: { capturedAt: 'asc' as const } } };

rescue.get('/dispatches/:id', async (req, res) => {
  let d = await prisma.dispatch.findUnique({ where: { id: req.params.id }, include: full });
  if (!d) return res.status(404).json({ error: 'Dispatch not found' });
  const waitingMin = Math.floor((Date.now() - +d.requestedAt) / 60000);
  if (d.status === 'PENDING_APPROVAL' && waitingMin >= TIMEOUT_MIN) {
    d = await prisma.dispatch.update({ where: { id: d.id }, data: { status: 'TIMED_OUT' }, include: full });
  }
  res.json({ ...d, waitingMin, timeoutMin: TIMEOUT_MIN });
});

// Approvals — handled by Operations Coordinator (UC3)
rescue.get('/approvals', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (_q, res) => {
  res.json(await prisma.dispatch.findMany({ where: { status: 'PENDING_APPROVAL' }, include: full, orderBy: { requestedAt: 'asc' } }));
});

rescue.post('/dispatches/:id/decision', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req, res) => {
  const d = await prisma.dispatch.findUnique({ where: { id: req.params.id } });
  if (!d) return res.status(404).json({ error: 'Dispatch not found' });
  if (d.status !== 'PENDING_APPROVAL') return res.status(409).json({ error: `Dispatch already ${d.status.toLowerCase()}` });
  const accept = req.body.accept === true;
  const u = await prisma.dispatch.update({ where: { id: d.id }, data: { status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() } });
  if (accept) {
    await prisma.rescueTeam.update({ where: { id: d.teamId }, data: { status: 'ASSIGNED' } });
    await prisma.rescueRequest.update({ where: { id: d.requestId }, data: { status: 'DISPATCHED' } });
  }
  res.json(u);
});

rescue.post('/dispatches/:id/cancel', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req, res) => {
  res.json(await prisma.dispatch.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }));
});

// Team leader: current assignment
rescue.get('/my-dispatch', allow('FIELD_RESPONDER'), async (req: AuthReq, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const d = await prisma.dispatch.findFirst({ where: { teamId: me!.teamId!, status: { in: ['ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'RETURNING'] } }, include: full, orderBy: { requestedAt: 'desc' } });
  res.json(d);
});

// Team leader status updates (idempotent on clientId for offline sync). Returning != Completed.
rescue.post('/dispatches/:id/status', allow('FIELD_RESPONDER'), async (req, res) => {
  const { status, clientId, capturedAt } = req.body as { status: 'EN_ROUTE' | 'ON_SITE' | 'RETURNING' | 'COMPLETED'; clientId: string; capturedAt?: string };
  if (!['EN_ROUTE', 'ON_SITE', 'RETURNING', 'COMPLETED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const d = await prisma.dispatch.findUnique({ where: { id: req.params.id } });
  if (!d) return res.status(404).json({ error: 'Dispatch not found' });
  if (clientId && (await prisma.dispatchLog.findUnique({ where: { clientId } }))) return res.json({ duplicate: true });
  if (status === 'COMPLETED' && d.status !== 'RETURNING' && d.status !== 'ON_SITE') return res.status(409).json({ error: 'Mission can only be completed after the team is on site or returning' });
  await prisma.dispatchLog.create({ data: { dispatchId: d.id, status, clientId, capturedAt: capturedAt ? new Date(capturedAt) : new Date() } });
  const u = await prisma.dispatch.update({ where: { id: d.id }, data: { status, completedAt: status === 'COMPLETED' ? new Date() : null } });
  if (status === 'COMPLETED') await prisma.rescueTeam.update({ where: { id: d.teamId }, data: { status: 'AVAILABLE' } });
  res.json(u);
});
