import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardTitle, Err, sevLabel } from '../components/ui';

const TYPES = ['Flood', 'Landslide', 'Cyclone', 'Strong Wind', 'Drought'];
const CH: [string, string][] = [['PUSH', 'Citizen App (Push)'], ['SMS', 'SMS'], ['SIREN', 'Available Siren']];

export default function CreateWarning() {
  const nav = useNavigate();
  const [areas, setAreas] = useState<any[]>([]); const [events, setEvents] = useState<any[]>([]);
  const [f, setF] = useState({ type: '', severity: '', title: '', description: '' });
  const [sel, setSel] = useState<string[]>([]); const [ch, setCh] = useState<string[]>(['PUSH']);
  const [q, setQ] = useState(''); const [recipients, setRecipients] = useState(0);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { api('/areas').then(setAreas); api('/events').then(setEvents); }, []);
  useEffect(() => { api(`/warnings/estimate?areaIds=${sel.join(',')}`).then((r) => setRecipients(r.recipients)); }, [sel]);
  const shown = useMemo(() => areas.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())), [areas, q]);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const names = areas.filter((a) => sel.includes(a.id)).map((a) => a.name).join(', ');
  const ready = f.type && f.severity && f.title && f.description && sel.length && recipients > 0 && ch.length;

  const send = async () => {
    if (!window.confirm(`Send ${sevLabel(f.severity)} severity warning to ${recipients.toLocaleString()} recipients in ${names}?`)) return;
    setBusy(true); setErr('');
    try { await api('/warnings', { body: { ...f, areaIds: sel, channels: ch, eventId: events[0]?.id } }); nav('/dmc/delivery'); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-bold">Create Warning</h1>
      <Err msg={err} />
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>1. Warning Details</CardTitle>
          <label className="lbl">Warning type</label>
          <select className="inp mb-4" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="">Select Type</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <label className="lbl">Severity</label>
          <select className="inp mb-4" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}><option value="">Select Severity</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>
          <label className="lbl">Title</label>
          <input className="inp mb-4" placeholder="Enter warning title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <label className="lbl">Description</label>
          <textarea className="inp h-[100px] resize-y" placeholder="Enter warning description..." value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Card>
        <Card>
          <CardTitle>2. Affected Areas</CardTitle>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-3.5 text-slate-500" /><input className="inp pl-9" placeholder="Type area name" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="mb-4 rounded-lg border border-slate-300 px-3 py-1">
            {shown.map((a) => (
              <label key={a.id} className="flex items-center gap-3 py-2 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-teal" checked={sel.includes(a.id)} onChange={() => setSel(toggle(sel, a.id))} />{a.name}</label>
            ))}
          </div>
          <div className="mb-3 text-[13px] font-bold">Estimated Target Recipients: {recipients.toLocaleString()}</div>
          {recipients === 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" /><div><b>Warning:</b> No target areas or recipients found. Select at least one affected area to continue.</div>
            </div>
          )}
        </Card>
        <Card>
          <CardTitle>3. Delivery Channels</CardTitle>
          <div className="space-y-4 pb-16">
            {CH.map(([k, l]) => <label key={k} className="flex items-center gap-3 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-teal" checked={ch.includes(k)} onChange={() => setCh(toggle(ch, k))} />{l}</label>)}
          </div>
        </Card>
        <Card>
          <CardTitle>4. Confirm &amp; Send</CardTitle>
          <div className="mb-4 text-[12px]">
            {[['Severity:', f.severity ? sevLabel(f.severity) : '–'], ['Selected Areas:', names || '–'], ['Recipients:', recipients.toLocaleString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-200 py-2.5 last:border-0"><span className="text-slate-500">{k}</span><b className="max-w-[60%] text-right">{v}</b></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn" onClick={() => nav('/dmc/dashboard')}>Cancel</button>
            <button disabled={!ready || busy} onClick={send} className="rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white disabled:bg-[#f7b896]">{busy ? 'Sending…' : 'Confirm & Send'}</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
