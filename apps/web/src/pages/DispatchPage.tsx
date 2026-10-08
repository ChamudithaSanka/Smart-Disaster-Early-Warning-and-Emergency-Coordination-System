import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Err } from '../components/ui';
import MapView from '../components/MapView';

const EOC = { lat: 6.9271, lng: 79.8612 };
const STATUS: any = { PENDING_APPROVAL: 'Pending', ACCEPTED: 'Approved', DECLINED: 'Declined', TIMED_OUT: 'Timed out', EN_ROUTE: 'Approved', ON_SITE: 'Approved', RETURNING: 'Approved', COMPLETED: 'Approved', CANCELLED: 'Cancelled' };
const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function DispatchPage() {
  const { id } = useParams(); const [sp] = useSearchParams(); const nav = useNavigate();
  const [d, setD] = useState<any>(null); const [draft, setDraft] = useState<any>(null); const [eta, setEta] = useState('17:30'); const [err, setErr] = useState('');
  const isNew = id === 'new';
  useEffect(() => {
    if (isNew) api(`/rescue/requests/${sp.get('request')}`).then((x) => setDraft({ request: x.request, team: x.candidates.find((c: any) => c.id === sp.get('team')) }));
    else { const load = () => api(`/rescue/dispatches/${id}`).then(setD).catch((e) => setErr(e.message)); load(); const t = setInterval(load, 5000); return () => clearInterval(t); }
  }, [id]);
  const confirm = async () => {
    setErr('');
    try { const x = await api('/rescue/dispatches', { body: { requestId: draft.request.id, teamId: draft.team.id, eta } }); nav(`/ops/dispatch/${x.id}`, { replace: true }); } catch (e: any) { setErr(e.message); }
  };
  if (isNew ? !draft : !d) return <div><Err msg={err} /><div className="text-slate-500">Loading…</div></div>;
  const request = isNew ? draft.request : d.request; const team = isNew ? draft.team : d.team;
  const lat = team?.lat, lng = team?.lng; const inc = { lat: request.lat, lng: request.lng };
  const status = isNew ? 'Pending' : STATUS[d.status];
  const live = d && ['ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'RETURNING', 'COMPLETED'].includes(d.status);
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-bold">Dispatch Confirmation and ETA</h1><Err msg={err} />
      <div className="grid grid-cols-[1.1fr_1fr] gap-4">
        <Card>
          <div className="grid grid-cols-[100px_1fr] gap-4 border-b border-slate-200 pb-3 text-[12px]"><div><div className="text-slate-500">Request ID</div><div className="text-[17px] font-bold">{request.id}</div></div><div><div className="text-slate-500">Location</div><div className="font-semibold">📍 {request.location}</div></div></div>
          <div className="py-3 text-[12px]"><div className="text-slate-500">Assigned Team</div><div className="text-[17px] font-bold">{team?.name}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 text-[12px]"><div className="text-slate-500">Coordinator Approval</div><div className={`mt-1 text-[16px] font-bold ${d?.status === 'DECLINED' || d?.status === 'TIMED_OUT' ? 'text-red-600' : ''}`}>{status}</div></div>
            <div className="rounded-lg border border-slate-200 p-3 text-[12px]"><div className="flex items-center gap-1 text-slate-500"><Clock size={12} />Waiting Time</div><div className="mt-1 text-[16px] font-bold">{String(d?.waitingMin ?? 0).padStart(2, '0')} min</div></div>
          </div>
          {(isNew || d.status === 'PENDING_APPROVAL') && <div className="mt-4"><label className="lbl">Estimated Time of Arrival (ETA)</label><div className="relative"><input type={isNew ? 'time' : 'text'} readOnly={!isNew} className="inp" value={isNew ? eta : d.eta} onChange={(e) => setEta(e.target.value)} /></div></div>}
          {live && (
            <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-[12px]">
              <div><b>Team Status:</b> {pretty(d.status === 'ACCEPTED' ? 'Assigned' : d.status)}</div>
              <div><b>Mission Status:</b> {d.status === 'COMPLETED' ? 'Completed' : 'In Progress'}</div>
              <div><b>Completion Confirmation:</b> {d.status === 'COMPLETED' ? 'Confirmed' : 'Pending'}</div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {isNew ? <><button className="btn-navy" onClick={confirm}>Confirm Dispatch</button><button className="btn" onClick={() => nav(-1)}>Cancel</button></>
              : (d.status === 'DECLINED' || d.status === 'TIMED_OUT') ? <><button className="btn-teal col-span-2" onClick={() => nav(`/ops/requests/${request.id}`)}>Choose Another Team</button></>
              : d.status === 'PENDING_APPROVAL' ? <><button className="btn-navy opacity-60" disabled>Awaiting approval…</button><button className="btn" onClick={async () => { await api(`/rescue/dispatches/${d.id}/cancel`, { method: 'POST' }); nav('/ops/requests'); }}>Cancel</button></>
              : <button className="btn col-span-2" onClick={() => nav('/ops/requests')}>Back to requests</button>}
          </div>
          {d?.status === 'TIMED_OUT' && <div className="mt-3 text-[11px] text-slate-500">No response within {d.timeoutMin} minutes. Reassign to another team.</div>}
        </Card>
        <Card>
          <div className="card-title">Route to Incident Location</div>
          <MapView height={330} route={[[EOC.lat, EOC.lng], [(EOC.lat + inc.lat) / 2 + 0.01, (EOC.lng + inc.lng) / 2 - 0.01], [inc.lat, inc.lng]]} points={[{ ...EOC, color: '#111', label: 'EOC' }, { ...inc, color: '#e8590c', label: 'Incident Location' }, ...(lat ? [{ lat, lng, color: '#0b6f82', r: 7, label: team.name }] : [])]} />
        </Card>
      </div>
    </div>
  );
}
