import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, fmtTime } from '../components/ui';
import MapView from '../components/MapView';
import { useEventId } from '../components/OpsLayout';

const FILTERS = ['All', 'Priority', 'Submitted', 'Under review'];
export default function ReviewQueue() {
  const eventId = useEventId(); const nav = useNavigate();
  const [data, setData] = useState<any>({ waiting: 0, items: [] }); const [f, setF] = useState('All'); const [zones, setZones] = useState<any[]>([]);
  useEffect(() => { api(`/reports/queue?eventId=${eventId}`).then(setData); api('/warnings').then((w) => setZones(w.filter((x: any) => x.status === 'ISSUED').flatMap((x: any) => x.areas.map((a: any) => ({ lat: a.lat, lng: a.lng, radiusKm: a.radiusKm, label: `${x.code} · ${x.title}` }))))); }, [eventId]);
  const items = data.items.filter((r: any) => f === 'All' || (f === 'Priority' && r.priority) || (f === 'Submitted' && r.status === 'SUBMITTED') || (f === 'Under review' && r.status === 'UNDER_REVIEW'));
  const status = (r: any) => (r.status === 'UNDER_REVIEW' ? `Under review — ${r.reviewer?.name || ''}, ${r.reviewStartedAt ? fmtTime(r.reviewStartedAt) : ''}` : r.status === 'SUBMITTED' ? 'Submitted' : r.status === 'NEEDS_MORE_INFO' ? 'Needs more info' : r.status[0] + r.status.slice(1).toLowerCase());
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold">Review queue — {data.waiting} waiting</h1>
        <div className="flex gap-2">{FILTERS.map((x) => <button key={x} onClick={() => setF(x)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${f === x ? 'border-navy2 bg-navy2 text-white' : 'border-slate-300 bg-white'}`}>{x}</button>)}</div>
      </div>
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-[13px]"><thead><tr className="border-b border-slate-200">{['REF', 'TYPE', 'LOCATION (GN DIVISION)', 'RECEIVED', 'CAPTURED', 'REPORTER', 'STATUS'].map((h) => <th key={h} className="th px-4">{h}</th>)}</tr></thead>
          <tbody>{items.map((r: any) => (
            <tr key={r.id} onClick={() => nav(`/ops/review/${r.id}`)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3.5 font-semibold">{r.ref}</td><td className="px-4">{r.category}</td><td className="px-4">{r.gnDivision}</td><td className="px-4">{fmtTime(r.receivedAt)}</td><td className="px-4">{fmtTime(r.capturedAt)}</td>
              <td className="px-4"><b>{r.reporter.name}</b>{r.priority && <span className="ml-2 rounded-full bg-navy2 px-2.5 py-0.5 text-[10px] font-bold text-white">PRIORITY · volunteer</span>}{!r.priority && <span className="font-normal"> </span>}</td>
              <td className="px-4">{status(r)}</td>
            </tr>))}</tbody></table>
      </Card>
      <div className="text-xs text-slate-500">Priority reports first, then by received time. Click a row to open it.</div>
      <Card><div className="card-title !normal-case !tracking-normal !font-semibold">Map — reports of this event (pins) and active warning areas (shaded)</div>
        <MapView height={300} zones={zones} points={data.items.filter((r: any) => r.lat).map((r: any) => ({ lat: r.lat, lng: r.lng, label: r.ref, color: r.priority ? '#111' : '#fff', fill: r.priority ? '#111' : '#fff' }))} />
      </Card>
    </div>
  );
}
