import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { auth, allow, AuthReq } from '../lib/auth';

export const reports = Router();
reports.use(auth);

const shape = (r: any) => ({
  id: r.id, ref: r.ref, category: r.category, description: r.description, photo: r.photo, lat: r.lat, lng: r.lng,
  locationText: r.locationText, gnDivision: r.gnDivision, capturedAt: r.capturedAt, receivedAt: r.receivedAt, status: r.status,
  priority: r.priority, officerQuestion: r.officerQuestion, extraInfo: r.extraInfo, decisionNote: r.decisionNote, decidedAt: r.decidedAt,
  areaId: r.areaId, eventId: r.eventId,
  reporter: r.reporter ? { id: r.reporter.id, name: r.reporter.name, volunteer: r.reporter.isVolunteer, area: r.reporter.area?.name } : undefined,
  reviewer: r.reviewer ? { id: r.reviewer.id, name: r.reviewer.name } : null,
});
const inc = { reporter: { include: { area: true } }, reviewer: true };

// Citizen submits (isVolunteer flag auto-marks report as priority; idempotent on clientId so offline retries never duplicate)
reports.post('/', allow('CITIZEN'), async (req: AuthReq, res) => {
  const { clientId, category, description, photo, lat, lng, locationText, capturedAt } = req.body;
  if (!clientId || !category || !description) return res.status(400).json({ error: 'Category and description are required' });
  if ((lat == null || lng == null) && !locationText?.trim()) return res.status(400).json({ error: 'Provide a GPS location or enter the location manually' });
  const dup = await prisma.groundReport.findUnique({ where: { clientId }, include: inc });
  if (dup) return res.json({ ...shape(dup), duplicate: true });
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { area: true } });
  const last = await prisma.groundReport.findFirst({ orderBy: { receivedAt: 'desc' }, select: { ref: true } });
  const seq = last ? parseInt(last.ref.slice(-4), 10) + 1 : 1;
  const event = await prisma.hazardEvent.findFirst({ where: { active: true }, orderBy: { startedAt: 'desc' } });
  const r = await prisma.groundReport.create({
    data: {
      ref: `GR-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`, clientId, category, description, photo, lat, lng, locationText,
      gnDivision: locationText || user?.area?.name || null, capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      priority: user!.isVolunteer, reporterId: user!.id, eventId: event?.id, areaId: user!.areaId,
    }, include: inc,
  });
  res.status(201).json(shape(r));
});

reports.get('/mine', allow('CITIZEN'), async (req: AuthReq, res) => {
  const list = await prisma.groundReport.findMany({ where: { reporterId: req.user!.id }, orderBy: { receivedAt: 'desc' }, include: inc });
  res.json(list.map(shape));
});

// Officer review queue: priority first, then newest received
reports.get('/queue', allow('DMC_OFFICER'), async (req, res) => {
  const eventId = req.query.eventId as string | undefined;
  const list = await prisma.groundReport.findMany({ where: eventId ? { eventId } : {}, include: inc, orderBy: { receivedAt: 'desc' } });
  const open = list.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status));
  list.sort((a, b) => Number(b.priority) - Number(a.priority) || +b.receivedAt - +a.receivedAt);
  res.json({ waiting: open.filter((r) => r.status === 'SUBMITTED').length, items: list.map(shape) });
});

reports.get('/:id', async (req: AuthReq, res) => {
  const r = await prisma.groundReport.findUnique({ where: { id: req.params.id }, include: inc });
  if (!r) return res.status(404).json({ error: 'Report not found' });
  if (req.user!.role === 'CITIZEN' && r.reporterId !== req.user!.id) return res.status(403).json({ error: 'Not your report' });
  res.json(shape(r));
});

// Open a report: marks it Under Review and locks it to this officer
reports.post('/:id/claim', allow('DMC_OFFICER'), async (req: AuthReq, res) => {
  const r = await prisma.groundReport.findUnique({ where: { id: req.params.id }, include: inc });
  if (!r) return res.status(404).json({ error: 'Report not found' });
  if (r.status === 'UNDER_REVIEW' && r.reviewerId !== req.user!.id) return res.status(409).json({ error: `Already under review by ${r.reviewer?.name}`, reviewer: r.reviewer?.name });
  if (r.status === 'SUBMITTED') {
    const u = await prisma.groundReport.update({ where: { id: r.id }, data: { status: 'UNDER_REVIEW', reviewerId: req.user!.id, reviewStartedAt: new Date() }, include: inc });
    return res.json(shape(u));
  }
  res.json(shape(r));
});

reports.post('/:id/decision', allow('DMC_OFFICER'), async (req: AuthReq, res) => {
  const { decision, note } = req.body as { decision: 'VERIFY' | 'REJECT' | 'REQUEST_INFO'; note?: string };
  const r = await prisma.groundReport.findUnique({ where: { id: req.params.id } });
  if (!r) return res.status(404).json({ error: 'Report not found' });
  if (r.status !== 'UNDER_REVIEW' || r.reviewerId !== req.user!.id) return res.status(409).json({ error: 'Report is not under your review' });
  if (decision !== 'VERIFY' && !note?.trim()) return res.status(400).json({ error: 'A reason or question is required' });
  const data: any = { decisionNote: note || null, decidedAt: new Date() };
  if (decision === 'VERIFY') data.status = 'VERIFIED';
  else if (decision === 'REJECT') data.status = 'REJECTED';
  else if (decision === 'REQUEST_INFO') { data.status = 'NEEDS_MORE_INFO'; data.officerQuestion = note; data.decidedAt = null; }
  else return res.status(400).json({ error: 'Invalid decision' });
  const u = await prisma.groundReport.update({ where: { id: r.id }, data, include: inc });
  res.json(shape(u));
});

// Reporter adds info to the SAME report (no duplicate report)
reports.post('/:id/info', allow('CITIZEN'), async (req: AuthReq, res) => {
  const { info, photo } = req.body;
  const r = await prisma.groundReport.findUnique({ where: { id: req.params.id } });
  if (!r || r.reporterId !== req.user!.id) return res.status(404).json({ error: 'Report not found' });
  if (r.status !== 'NEEDS_MORE_INFO') return res.status(409).json({ error: 'No additional information was requested' });
  if (!info?.trim()) return res.status(400).json({ error: 'Enter the additional information' });
  const u = await prisma.groundReport.update({ where: { id: r.id }, data: { extraInfo: info, extraPhoto: photo, status: 'SUBMITTED', reviewerId: null }, include: inc });
  res.json(shape(u));
});
