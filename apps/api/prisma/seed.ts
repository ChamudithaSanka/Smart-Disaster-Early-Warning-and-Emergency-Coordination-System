import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  for (const t of ['reliefDistribution','reliefStock','occupancyUpdate','dispatchLog','dispatch','alert','escalation','groundReport','warning','rescueRequest']) await (prisma as any)[t].deleteMany();
  await prisma.user.deleteMany(); await prisma.rescueTeam.deleteMany(); await prisma.safetyCentre.deleteMany();
  await prisma.organization.deleteMany(); await prisma.hazardEvent.deleteMany(); await prisma.area.deleteMany();

  const areaData = [['Colombo',6.9271,79.8612],['Gampaha',7.0873,79.9925],['Kalutara',6.5854,79.9607],['Kandy',7.2906,80.6337],['Matale',7.4675,80.6234]] as const;
  const areas: any[] = [];
  for (const [name, lat, lng] of areaData) areas.push(await prisma.area.create({ data: { name, district: name, lat, lng } }));
  const A = (n: string) => areas.find((a) => a.name === n).id;

  const event = await prisma.hazardEvent.create({ data: { name: 'Kelani Basin Flood, Aug 2026', type: 'Flood' } });
  await prisma.hazardEvent.create({ data: { name: 'Central Highlands Landslide Watch', type: 'Landslide' } });

  const army = await prisma.organization.create({ data: { name: 'Sri Lanka Army', type: 'ARMED_FORCES' } });
  const ngo = await prisma.organization.create({ data: { name: 'Red Cross Sri Lanka', type: 'NGO' } });

  const mk = (name: string, email: string, role: any, extra: any = {}) => prisma.user.create({ data: { name, email, role, passwordHash: hash, ...extra } });
  await mk('S. Jayasinghe', 'dmc@demo.lk', 'DMC_OFFICER');
  await mk('Operations Coordinator', 'ops@demo.lk', 'OPERATIONS_COORDINATOR', { orgId: army.id });

  // Citizens (recipients) – 60 per area, 80% with phone numbers
  const rows: any[] = [];
  for (const a of areas) for (let i = 1; i <= 60; i++) rows.push({ name: `${a.name} Citizen ${i}`, email: `c-${a.name.toLowerCase()}-${i}@demo.lk`, role: 'CITIZEN', passwordHash: hash, areaId: a.id, phone: i % 5 ? `+9477${String(1000000 + rows.length)}` : null, nationalId: `20${String(1000000000 + rows.length)}` });
  await prisma.user.createMany({ data: rows });
  await mk('Nimal Perera', 'volunteer@demo.lk', 'CITIZEN', { areaId: A('Colombo'), phone: '+94771234567', isVolunteer: true });
  await mk('Kasun Citizen', 'citizen@demo.lk', 'CITIZEN', { areaId: A('Colombo'), phone: '+94771112222' });

  const teams = [['Team A', army.id, 6.95, 79.9], ['Team B', army.id, 6.9, 79.86], ['Team C', ngo.id, 7.0, 79.95]] as const;
  const created: any[] = [];
  for (const [name, orgId, lat, lng] of teams) created.push(await prisma.rescueTeam.create({ data: { name, orgId, lat, lng, capabilities: ['FLOOD', 'MEDEVAC'] } }));
  await mk('Team B Leader', 'leader@demo.lk', 'FIELD_RESPONDER', { teamId: created[1].id });

  const centres = [['Kaduwela School', 'Kaduwela, Colombo', 6.9337, 79.9842, 30, 'ACTIVE', 18], ['Hanwella Community Hall', 'Hanwella', 6.9027, 80.0836, 80, 'ACTIVE', 20], ['Avissawella Temple', 'Avissawella', 6.9535, 80.2086, 120, 'ACTIVE', 40], ['Padukka Town Hall', 'Padukka', 6.8394, 80.0897, 100, 'INACTIVE', 0]] as const;
  const cs: any[] = [];
  for (const [name, address, lat, lng, capacity, status, occupancy] of centres) cs.push(await prisma.safetyCentre.create({ data: { name, address, lat, lng, capacity, status: status as any, occupancy } }));
  await mk('Shelter Operator', 'shelter@demo.lk', 'FIELD_RESPONDER', { centreId: cs[0].id });

  const reqs = [['HIGH', 'Flood rescue', 'Hanwella Road', 6.9027, 80.0836, '07:30'], ['MED', 'Flood rescue', 'Galle Road, Colombo', 6.9, 79.85, '07:40'], ['LOW', 'Medevac rescue', 'Colombo Road', 6.93, 79.87, '21:18'], ['LOW', 'Stranded rescue', 'Colombo Road', 6.94, 79.88, '16:38']] as const;
  for (const [priority, type, location, lat, lng] of reqs) await prisma.rescueRequest.create({ data: { priority: priority as any, type, location, lat, lng, details: `${type} in area; water levels rising, residents trapped on first floor.`, author: 'Nimal Perera', contact: '+94 77 123 4567' } });

  await prisma.reliefStock.createMany({ data: [{ orgId: army.id, item: 'Water', unit: 'L', quantity: 5000 }, { orgId: army.id, item: 'Food packs', unit: 'packs', quantity: 800 }, { orgId: army.id, item: 'Medicine kits', unit: 'kits', quantity: 150 }] });

  // Seed reports like the wireframes
  const reporter = await prisma.user.findUnique({ where: { email: 'volunteer@demo.lk' } });
  const cit = await prisma.user.findUnique({ where: { email: 'citizen@demo.lk' } });
  const mkR = (ref: string, cat: string, gn: string, cap: string, rec: string, who: any, pri: boolean, lat: number, lng: number, desc: string) =>
    prisma.groundReport.create({ data: { ref, clientId: ref, category: cat, description: desc, gnDivision: gn, lat, lng, capturedAt: new Date(`2026-08-03T${cap}:00`), receivedAt: new Date(`2026-08-03T${rec}:00`), reporterId: who.id, priority: pri, eventId: event.id, areaId: who.areaId } });
  await mkR('GR-2026-0418', 'Rising river', 'Hanwella', '22:41', '22:56', reporter, true, 6.9027, 80.0836, 'Water is above the 1.5 m mark on the footbridge');
  await mkR('GR-2026-0417', 'Blocked road', 'Padukka', '22:10', '22:12', cit, false, 6.8394, 80.0897, 'Fallen tree blocking the main road');
  await mkR('GR-2026-0416', 'Other', 'Avissawella', '21:52', '21:55', cit, false, 6.9535, 80.2086, 'Drain overflowing near the market');

  const officer = await prisma.user.findUnique({ where: { email: 'dmc@demo.lk' } });
  await prisma.warning.create({ data: { code: 'W-0221', type: 'Flood', severity: 'LOW', title: 'Kelani basin - Level 1 Yellow', description: 'River levels rising along the Kelani basin.', channels: ['PUSH', 'SMS'], validUntil: new Date(Date.now() + 8 * 3600000), issuedById: officer!.id, eventId: event.id, areas: { connect: [{ id: A('Colombo') }] } } });
  console.log('Seeded. Login with any *@demo.lk demo email, password: Password123!');
}
main().finally(() => prisma.$disconnect());
