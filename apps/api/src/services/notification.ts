import { Channel, AlertStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Mock gateways: [delivered, pending] probability, remainder = failed.
const OUTCOME: Record<Channel, [number, number]> = { PUSH: [0.96, 0.02], SMS: [0.87, 0.03], SIREN: [0.92, 0.05] };
function outcome(ch: Channel): AlertStatus {
  const [d, p] = OUTCOME[ch]; const r = Math.random();
  return r < d ? 'DELIVERED' : r < d + p ? 'PENDING' : 'FAILED';
}

async function expoPush(tokens: string[], title: string, body: string, data: any) {
  const valid = tokens.filter((t) => t.startsWith('ExponentPushToken'));
  if (!valid.length) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid.map((to) => ({ to, title, body, data, sound: 'default', priority: 'high' }))),
    });
  } catch (e) { console.error('push failed', e); }
}

export async function sendAlerts(
  warning: { id: string; title: string; description: string },
  citizens: { id: string; phone: string | null; areaId: string | null; pushToken: string | null }[],
  channels: Channel[], areaIds: string[],
) {
  const rows: any[] = [];
  for (const c of citizens) for (const ch of channels) {
    if (ch === 'SIREN') continue;
    if (ch === 'SMS' && !c.phone) continue;
    const status = outcome(ch);
    rows.push({ warningId: warning.id, citizenId: c.id, areaId: c.areaId, channel: ch, status, failureReason: status === 'FAILED' ? 'Gateway rejected' : null });
  }
  if (channels.includes('SIREN')) for (const a of areaIds) {
    const status = outcome('SIREN');
    rows.push({ warningId: warning.id, areaId: a, channel: 'SIREN', status, failureReason: status === 'FAILED' ? 'Siren unreachable' : null });
  }
  if (rows.length) await prisma.alert.createMany({ data: rows });
  if (channels.includes('PUSH')) void expoPush(citizens.map((c) => c.pushToken || '').filter(Boolean), warning.title, warning.description, { warningId: warning.id });
  return rows.length;
}

export async function deliveryStats(where: any = {}) {
  const alerts = await prisma.alert.findMany({ where, select: { channel: true, status: true, citizenId: true, createdAt: true } });
  const sum = (f: (a: any) => boolean) => alerts.filter(f).length;
  const total = alerts.length, delivered = sum((a) => a.status === 'DELIVERED');
  const pending = sum((a) => a.status === 'PENDING'), failed = sum((a) => a.status === 'FAILED');
  const unique = new Set(alerts.filter((a) => a.status === 'DELIVERED' && a.citizenId).map((a) => a.citizenId)).size;
  const byChannel = (['PUSH', 'SMS', 'SIREN'] as Channel[]).map((ch) => {
    const l = alerts.filter((a) => a.channel === ch), d = l.filter((a) => a.status === 'DELIVERED').length;
    return { channel: ch, sent: l.length, delivered: d, pending: l.filter((a) => a.status === 'PENDING').length, failed: l.filter((a) => a.status === 'FAILED').length, success: l.length ? Math.round((d / l.length) * 100) : 0 };
  });
  const days = new Map<string, number>();
  alerts.sort((a, b) => +a.createdAt - +b.createdAt).forEach((a) => { const k = a.createdAt.toISOString().slice(0, 10); days.set(k, (days.get(k) || 0) + 1); });
  let cum = 0;
  const series = [...days.entries()].map(([date, n]) => ({ date, total: (cum += n) }));
  return { total, delivered, pending, failed, unique, success: total ? Math.round((delivered / total) * 100) : 0, byChannel, series };
}
