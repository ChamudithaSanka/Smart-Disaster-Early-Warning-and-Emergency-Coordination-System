import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardTitle, Pill, sevLabel, fmtDate, fmtTime } from '../components/ui';

const STAT = [['ACTIVE WARNINGS', 'activeWarnings', 'border-teal', 'View all', '/dmc/warnings'], ['AFFECTED AREAS', 'affectedAreas', 'border-violet-500', 'View all', '/dmc/areas'], ['CITIZENS REACHED', 'citizensReached', 'border-orange', 'View reports', '/dmc/delivery'], ['DELIVERY SUCCESS', 'deliverySuccess', 'border-green-600', 'View details', '/dmc/delivery']];

function Donut({ pct }: { pct: number }) {
  const r = 62, c = 2 * Math.PI * r;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
      <circle cx="75" cy="75" r={r} fill="none" stroke="#0b6f82" strokeWidth="16" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 75 75)" />
      <text x="75" y="76" textAnchor="middle" fontSize="28" fontWeight="700" fill="#14213d">{pct}%</text>
      <text x="75" y="96" textAnchor="middle" fontSize="12" fill="#64748b">Delivered</text>
    </svg>
  );
}
const LABEL: any = { PUSH: 'Citizen App (Push)', SMS: 'SMS', SIREN: 'Audible Siren' };

export default function Dashboard() {
  const [d, setD] = useState<any>(null); const nav = useNavigate(); const [note, setNote] = useState('');
  useEffect(() => { api('/warnings/summary').then(setD); }, []);
  if (!d) return <div className="text-slate-500">Loading…</div>;
  const s = d.stats; const pct = (n: number) => (s.total ? Math.round((n / s.total) * 100) : 0);
  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold">Dashboard Overview</h1>
      <div className="grid grid-cols-4 gap-4">
        {STAT.map(([l, k, b, link, to]) => (
          <div key={k} className={`card border-t-4 ${b} text-center`}>
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{l}</div>
            <div className="my-1 text-[34px] font-bold leading-tight">{k === 'deliverySuccess' ? `${d[k]}%` : Number(d[k]).toLocaleString()}</div>
            <Link to={to} className="text-xs font-semibold text-teal">{link}</Link>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1.45fr_1fr] gap-4">
        <Card>
          <CardTitle>Recent Warning</CardTitle>
          {d.latest ? (
            <div className="flex gap-4">
              <div className="flex h-[100px] w-[140px] items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-400">▨</div>
              <div>
                <div className="text-lg font-bold">{d.latest.title}</div>
                <div className="text-xs text-slate-500">Severity: <Pill level={d.latest.severity} label={sevLabel(d.latest.severity)} /></div>
                <div className="text-xs text-slate-500">Issued: {fmtDate(d.latest.issuedAt)}</div>
                <div className="text-xs text-slate-500">Affected Areas: {d.latest.areas.map((a: any) => a.name).join(', ')}</div>
                <button onClick={() => nav('/dmc/warnings')} className="btn mt-2 px-5 py-2">View details</button>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">No warnings issued yet.</p>}
        </Card>
        <Card>
          <CardTitle>Warning Delivery Status</CardTitle>
          <div className="flex items-center justify-around">
            <Donut pct={s.success} />
            <ul className="space-y-2 text-xs text-slate-700">
              <li>☐ Delivered {s.delivered.toLocaleString()} ({pct(s.delivered)}%)</li>
              <li>☐ Pending {s.pending.toLocaleString()} ({pct(s.pending)}%)</li>
              <li>☐ Failed {s.failed.toLocaleString()} ({pct(s.failed)}%)</li>
            </ul>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-4">
        <Card>
          <CardTitle>Delivery Channels</CardTitle>
          <div className="space-y-3 text-xs">
            {s.byChannel.map((c: any) => (
              <div key={c.channel} className="grid grid-cols-[110px_50px_1fr_34px] items-center gap-2">
                <span>{LABEL[c.channel]}</span><span>{c.sent.toLocaleString()}</span>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal to-cyan-500" style={{ width: `${c.success}%` }} /></div>
                <span className="text-right">{c.success}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <ul className="space-y-2 text-xs">{d.activity.map((a: any, i: number) => <li key={i} className="flex justify-between"><span>☐ {a.text}</span><span className="text-slate-500">{fmtTime(a.at)}</span></li>)}</ul>
        </Card>
        <Card>
          <CardTitle>Notes</CardTitle>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="inp h-[110px] resize-y" />
        </Card>
      </div>
      <Card>
        <CardTitle>Warning Creation Flow</CardTitle>
        <div className="relative flex justify-between px-12 pb-1 pt-2">
          <div className="absolute left-[10%] right-[10%] top-[18px] h-[2px] bg-teal" />
          {['Create Warning', 'Select Areas', 'Confirm Warning', 'Send Notifications', 'Record Delivery'].map((t, i) => (
            <div key={t} className="relative z-10 text-center text-xs"><div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-teal font-bold text-white ring-4 ring-white">{i + 1}</div>{t}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
