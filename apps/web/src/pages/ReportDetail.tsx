import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Err, fmtTime, levelName } from '../components/ui';
import MapView from '../components/MapView';

const NEXT: any = { LOW: [['MEDIUM', 'Level 2 Amber'], ['HIGH', 'Level 3 Red']], MEDIUM: [['HIGH', 'Level 3 Red']], HIGH: [] };
export default function ReportDetail() {
  const { id } = useParams(); const [r, setR] = useState<any>(null); const [w, setW] = useState<any>(null);
  const [err, setErr] = useState(''); const [note, setNote] = useState(''); const [lvl, setLvl] = useState(''); const [reason, setReason] = useState(''); const [ok, setOk] = useState('');
  const loadWarning = (rep: any) => rep.areaId && api(`/warnings/covering?areaId=${rep.areaId}`).then((x) => { setW(x); if (x) { setLvl(NEXT[x.severity][0]?.[0] || ''); setReason(`${rep.category} at ${rep.gnDivision} — verified ground report`); } });
  useEffect(() => { api(`/reports/${id}/claim`, { method: 'POST' }).then((x) => { setR(x); loadWarning(x); }).catch((e) => setErr(e.message)); }, [id]);
  if (!r) return <div><Link to="/ops/review" className="text-xs underline">Review queue</Link><div className="mt-4"><Err msg={err} /></div></div>;
  const decide = async (decision: string) => {
    setErr('');
    try { const x = await api(`/reports/${id}/decision`, { body: { decision, note } }); setR(x); setNote(''); loadWarning(x); } catch (e: any) { setErr(e.message); }
  };
  const escalate = async () => {
    setErr('');
    try { await api(`/warnings/${w.id}/escalate`, { body: { severity: lvl, reason, reportId: r.id } }); setOk('Warning escalated and citizens in the target areas notified.'); setW(null); } catch (e: any) { setErr(e.message); }
  };
  const statusLine = r.status === 'VERIFIED' ? `Verified — ${r.reviewer?.name}, ${fmtTime(r.decidedAt)}` : r.status === 'UNDER_REVIEW' ? 'Under review' : r.status.replace(/_/g, ' ').toLowerCase().replace(/^./, (c: string) => c.toUpperCase());
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs"><div><Link to="/ops/review" className="underline">Review queue</Link> › {r.ref}</div><div className="text-slate-500">S. Jayasinghe · night shift</div></div>
      <div className="flex items-center gap-3"><h1 className="text-[22px] font-bold">{r.ref} · {r.category}</h1><span className="rounded-full bg-navy2 px-3 py-1 text-[11px] font-semibold text-white">Status: {statusLine}</span></div>
      <Err msg={err} />{ok && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</div>}
      <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-4">
        <Card className="flex min-h-[250px] flex-col items-center justify-center overflow-hidden !p-0 text-sm text-slate-500">
          {r.photo ? <img src={r.photo} className="h-full w-full object-cover" /> : <><div>photo</div><div className="mt-16 text-[11px]">Photo — captured {fmtTime(r.capturedAt)} by the reporter (MediaFile)</div></>}
        </Card>
        <Card>
          <div className="mb-2 text-[11px] font-semibold text-slate-600">{r.gnDivision} GN division · {r.reporter?.area} District</div>
          <MapView height={215} zones={w ? w.areas.map((a: any) => ({ lat: a.lat, lng: a.lng, radiusKm: a.radiusKm, label: `${w.code} · ${w.title}` })) : []} points={r.lat ? [{ lat: r.lat, lng: r.lng, label: r.ref }] : []} />
        </Card>
        <Card>
          <div className="card-title">Description</div><p className="mb-4 text-[13px]">{r.description}</p>
          {r.extraInfo && <><div className="card-title">Reporter's additional information</div><p className="mb-4 text-[13px]">{r.extraInfo}</p></>}
          <div className="card-title">Reporter</div>
          <div className="mb-1 text-[13px] font-bold">{r.reporter?.name} {r.reporter?.volunteer && <span className="ml-1 rounded-full bg-navy2 px-2.5 py-0.5 text-[10px] font-bold text-white">Community volunteer</span>}</div>
          <div className="mb-3 text-[11px] text-slate-500">{r.gnDivision} GN-division Disaster Management Committee</div>
          <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-3 gap-y-2 border-t border-slate-100 pt-2 text-[12px]">
            <span className="text-slate-500">Captured</span><span>{fmtTime(r.capturedAt)} (device)</span><span className="text-slate-500">Received</span><span>{fmtTime(r.receivedAt)} (server)</span>
            <span className="text-slate-500">Category</span><span>{r.category}</span><span className="text-slate-500">Reference</span><span>{r.ref}</span>
          </div>
        </Card>
      </div>
      {r.status === 'UNDER_REVIEW' && (
        <Card>
          <div className="mb-3 text-[15px] font-bold">Verification decision</div>
          <input className="inp mb-3" placeholder="Verification note, rejection reason or question for the reporter" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-3"><button className="btn-navy" onClick={() => decide('VERIFY')}>Verify</button><button className="btn" onClick={() => decide('REQUEST_INFO')}>Request more information</button><button className="btn text-red-600" onClick={() => decide('REJECT')}>Reject</button></div>
        </Card>
      )}
      {r.status === 'VERIFIED' && w && NEXT[w.severity].length > 0 && (
        <Card>
          <div className="text-[15px] font-bold">An active warning covers this location</div>
          <div className="mb-3 mt-1 text-[11px] text-slate-500">{w.code} · {w.title.replace(/ - .*/, '')} · {levelName(w.severity)} · issued {fmtTime(w.issuedAt)} · valid until {fmtTime(w.validUntil)}</div>
          <div className="grid grid-cols-[1fr_2.2fr_auto] items-end gap-3">
            <div><label className="lbl">Escalate to</label><select className="inp" value={lvl} onChange={(e) => setLvl(e.target.value)}>{NEXT[w.severity].map(([v, l]: string[]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label className="lbl">Reason</label><input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <button className="btn-navy" onClick={escalate}>Escalate warning</button>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">Evidence attached: {r.ref} (verified). Escalation raises the level, restarts the validity period and notifies the citizens in the warning's target areas. Escalation is offered to the officer, never done automatically.</div>
        </Card>
      )}
    </div>
  );
}
