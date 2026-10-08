import { Router } from 'express';
import { prisma } from '../../../../../../cssecloud/disaster-system/apps/api/src/lib/prisma';
import { auth, allow, AuthReq } from '../../../../../../cssecloud/disaster-system/apps/api/src/lib/auth';
import { km } from '../../../../../../cssecloud/disaster-system/apps/api/src/lib/geo';

export const centres = Router();
export const relief = Router();
export const misc = Router();
centres.use(auth); relief.use(auth); misc.use(auth);

async function alternatives(c: { id: string; lat: number; lng: number }, needed = 1) {
  const list = await prisma.safetyCentre.findMany({ where: { status: 'ACTIVE', id: { not: c.id } } });
  return list.filter((x) => x.capacity - x.occupancy >= needed).map((x) => ({ id: x.id, name: x.name, address: x.address, remaining: x.capacity - x.occupancy, capacity: x.capacity, distanceKm: km(c, x) })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
}

centres.get('/', async (_q, res) => res.json(await prisma.safetyCentre.findMany({ orderBy: { name: 'asc' } })));

centres.get('/mine', allow('FIELD_RESPONDER'), async (req: AuthReq, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { centre: true } });
  if (!me?.centre) return res.status(404).json({ error: 'No safety centre assigned to you' });
  res.json(me.centre);
});

centres.get('/:id/alternatives', async (req, res) => {
  const c = await prisma.safetyCentre.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ error: 'Centre not found' });
  res.json(await alternatives(c, Number(req.query.needed) || 1));
});

centres.get('/:id/history', async (req, res) => {
  res.json(await prisma.occupancyUpdate.findMany({ where: { centreId: req.params.id }, orderBy: { capturedAt: 'desc' }, take: 50 }));
});

centres.post('/:id/activate', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req, res) => res.json(await prisma.safetyCentre.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } })));
centres.post('/:id/close', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req, res) => res.json(await prisma.safetyCentre.update({ where: { id: req.params.id }, data: { status: 'CLOSED' } })));

// Occupancy update. Idempotent on clientId; offline updates older than the centre's latest data are flagged as conflicts.
centres.post('/:id/occupancy', allow('FIELD_RESPONDER'), async (req: AuthReq, res) => {
  const { clientId, headcount, families = 0, capturedAt } = req.body;
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (me?.centreId !== req.params.id) return res.status(403).json({ error: 'You are not assigned to this safety centre' });
  const c = await prisma.safetyCentre.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ error: 'Centre not found' });
  if (c.status !== 'ACTIVE' && c.status !== 'FULL') return res.status(409).json({ error: 'This centre is not active' });
  if (clientId && (await prisma.occupancyUpdate.findUnique({ where: { clientId } }))) return res.json({ duplicate: true, centre: c });
  if (!Number.isInteger(headcount) || headcount < 0) return res.status(400).json({ error: 'Headcount must be a positive whole number' });
  const captured = capturedAt ? new Date(capturedAt) : new Date();
  if (captured < c.updatedAt) {
    await prisma.occupancyUpdate.create({ data: { clientId, centreId: c.id, operatorId: me!.id, headcount, families, capturedAt: captured, applied: false, note: 'Conflicts with newer centre data' } });
    return res.status(409).json({ conflict: true, error: 'This update conflicts with newer data and needs review', centre: c });
  }
  if (headcount > c.capacity) return res.status(422).json({ full: true, error: `Capacity is ${c.capacity}`, alternatives: await alternatives(c, headcount - c.capacity), centre: c });
  const isFull = headcount >= c.capacity;
  const upd = await prisma.safetyCentre.update({ where: { id: c.id }, data: { occupancy: headcount, families, status: isFull ? 'FULL' : 'ACTIVE', updatedAt: new Date() } });
  await prisma.occupancyUpdate.create({ data: { clientId, centreId: c.id, operatorId: me!.id, headcount, families, capturedAt: captured, applied: true } });
  res.json({ centre: upd, full: isFull, alternatives: isFull ? await alternatives(c, 1) : [] });
});

// ---- Relief distribution + Centre management (Operations Coordinator UC4) ----
relief.get('/stock', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req: AuthReq, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(await prisma.reliefStock.findMany({ where: me?.orgId ? { orgId: me.orgId } : {}, orderBy: { item: 'asc' } }));
});
relief.get('/distributions', async (req, res) => {
  res.json(await prisma.reliefDistribution.findMany({ where: req.query.centreId ? { centreId: String(req.query.centreId) } : {}, orderBy: { at: 'desc' }, take: 50 }));
});
relief.post('/distributions', allow('OPERATIONS_COORDINATOR', 'DMC_OFFICER'), async (req: AuthReq, res) => {
  const { item, quantity, centreId, areaId } = req.body;
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!centreId && !areaId) return res.status(400).json({ error: 'Select a safety centre or GN division' });
  if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: 'Enter a valid quantity' });
  const result = await prisma.$transaction(async (tx) => {
    const stock = await tx.reliefStock.findFirst({ where: { orgId: me!.orgId!, item } });
    if (!stock) throw Object.assign(new Error('Item not in stock'), { status: 404 });
    if (stock.quantity < quantity) throw Object.assign(new Error(`Insufficient stock. Available: ${stock.quantity} ${stock.unit}`), { status: 422 }); // final re-check inside the transaction
    await tx.reliefStock.update({ where: { id: stock.id }, data: { quantity: { decrement: quantity } } });
    return tx.reliefDistribution.create({ data: { orgId: stock.orgId, item, unit: stock.unit, quantity, centreId, areaId, recordedById: me!.id } });
  });
  res.status(201).json(result);
});

// ---- Shared lookups ----
misc.get('/areas', async (_q, res) => {
  const areas = await prisma.area.findMany({ orderBy: { name: 'asc' } });
  const counts = await prisma.user.groupBy({ by: ['areaId'], where: { role: 'CITIZEN' }, _count: true });
  res.json(areas.map((a) => ({ ...a, citizens: counts.find((c) => c.areaId === a.id)?._count || 0 })));
});
misc.get('/events', async (_q, res) => res.json(await prisma.hazardEvent.findMany({ where: { active: true }, orderBy: { startedAt: 'desc' } })));
misc.get('/alerts/mine', async (req: AuthReq, res) => {
  res.json(await prisma.alert.findMany({ where: { citizenId: req.user!.id, status: { not: 'FAILED' } }, include: { warning: true }, orderBy: { createdAt: 'desc' }, take: 30 }));
});
