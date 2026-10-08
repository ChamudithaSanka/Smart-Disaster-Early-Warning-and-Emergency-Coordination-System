import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardTitle } from '../components/ui';
import MapView from '../components/MapView';

export default function Assignment() {
  const { id } = useParams(); const nav = useNavigate();
  const [d, setD] = useState<any>(null); const [team, setTeam] = useState('');
  useEffect(() => { api(`/rescue/requests/${id}`).then((x) => { setD(x); setTeam(x.candidates[1]?.id || x.candidates[0]?.id || ''); }); }, [id]);
  if (!d) return <div className="text-slate-500">Loading…</div>;
  const { request: r, candidates } = d; const sel = candidates.find((c: any) => c.id === team);
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-bold">Request and Team Assignment</h1>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card>
          <CardTitle>Request Detail</CardTitle>
          <div className="space-y-1.5 text-[13px]">
            <div>🔥 <b>Incident:</b> {r.type.replace(' rescue', '')}</div><div>📍 <b>Location:</b> {r.location}</div><div>📝 <b>Details:</b> {r.details}</div><div>👤 <b>Author:</b> {r.author}</div><div>✉️ <b>Contact:</b> {r.contact}</div>
          </div>
          <div className="mt-4"><MapView height={230} points={[{ lat: r.lat, lng: r.lng, color: '#dc2626', label: 'Incident' }, ...candidates.map((c: any) => ({ lat: c.lat, lng: c.lng, color: c.id === team ? '#0b6f82' : '#94a3b8', r: 7, label: c.name }))]} /></div>
        </Card>
        <Card>
          <CardTitle>Available Teams</CardTitle>
          {candidates.length === 0 && <p className="mb-3 text-sm text-slate-500">No suitable team is available right now.</p>}
          <div className="space-y-3">
            {candidates.map((c: any) => (
              <label key={c.id} className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-[13px] ${team === c.id ? 'border-teal bg-teal-soft' : 'border-slate-300'}`}>
                <span className="flex items-center gap-3"><input type="radio" className="accent-teal" checked={team === c.id} onChange={() => setTeam(c.id)} />{c.name.toUpperCase()}</span><span className="text-[11px] text-slate-500">{c.distanceKm} km · {c.org}</span>
              </label>
            ))}
          </div>
          <button disabled={!team} onClick={() => nav(`/ops/dispatch/new?request=${r.id}&team=${team}`)} className="btn-teal mt-4 w-full">Select {sel?.name || 'team'}</button>
        </Card>
      </div>
    </div>
  );
}
