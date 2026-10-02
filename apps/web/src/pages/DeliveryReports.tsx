import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardTitle, Pill, sevLabel, fmtDate } from '../components/ui';

const LABEL: any = { PUSH: 'Citizen App (Push)', SMS: 'SMS', SIREN: 'Public Address Siren' };
export default function DeliveryReports() {
  const [d, setD] = useState<any>(null); const [list, setList] = useState<any[]>([]);
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [w, setW] = useState('');
  const load = () => api(`/warnings/delivery?from=${from}&to=${to}&warningId=${w}`).then(setD);
  useEffect(() => { load(); api('/warnings').then(setList); }, []);
  if (!d) return <div className="text-slate-500">Loading…</div>;
  const mini = (label: string, v: number, color: string) => (
    <div className={`rounded-xl border-t-4 bg-white px-4 py-3 text-center shadow-card ${color}`}><div className="text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 text-[26px] font-bold">{v.toLocaleString()}</div></div>
  );
  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-bold">Delivery Reports</h1>
      <div className="flex items-end gap-3">
        {[['Date from', from, setFrom], ['Date to', to, setTo]].map(([l, v, set]: any) => (
          <div key={l}><label className="lbl">{l}</label><div className="relative"><input type="date" className="inp w-[150px]" value={v} onChange={(e) => set(e.target.value)} /><Calendar size={0} /></div></div>
        ))}
        <div><label className="lbl">Warning</label><select className="inp w-[150px]" value={w} onChange={(e) => setW(e.target.value)}><option value="">All</option>{list.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></div>
        <button className="btn" onClick={load}>Filter</button>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-4">
        <Card><CardTitle>Notification Counts</CardTitle>
          <div className="grid grid-cols-4 gap-3">{mini('Total Sent', d.total, 'border-teal')}{mini('Delivered', d.delivered, 'border-violet-500')}{mini('Pending', d.pending, 'border-orange')}{mini('Failed', d.failed, 'border-green-600')}</div>
        </Card>
        <div className="card border-t-4 border-teal text-center"><div className="text-[12px] font-bold uppercase tracking-wide">Recipient Count</div><div className="mt-2 text-[10px] uppercase text-slate-500">Unique citizens reached</div><div className="text-[34px] font-bold">{d.unique.toLocaleString()}</div><div className="text-[11px] font-semibold text-teal">Citizens receiving SMS and push are counted once.</div></div>
        <div className="card border-t-4 border-teal text-center"><div className="mt-6 text-[10px] uppercase text-slate-500">Success rate</div><div className="text-[34px] font-bold">{d.success}%</div></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>Delivery by Channel</CardTitle>
          <table className="w-full text-[13px]"><thead><tr>{['Channel', 'Sent', 'Delivered', 'Pending', 'Failed', 'Success'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{d.byChannel.map((c: any) => <tr key={c.channel} className="border-t border-slate-100"><td className="py-3">{LABEL[c.channel]}</td><td>{c.sent.toLocaleString()}</td><td>{c.delivered.toLocaleString()}</td><td>{c.pending}</td><td>{c.failed}</td><td>{c.success}%</td></tr>)}</tbody></table>
        </Card>
        <Card><CardTitle>Delivery Over Time</CardTitle>
          <div className="h-[210px]"><ResponsiveContainer><LineChart data={d.series} margin={{ left: -10, right: 10, top: 10 }}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="linear" dataKey="total" stroke="#e8590c" strokeWidth={2} dot={{ r: 4, fill: '#e8590c' }} /></LineChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card><CardTitle>Recent Warnings</CardTitle>
        <table className="w-full text-[13px]"><thead><tr>{['Warning Title', 'Severity', 'Issued', 'Affected Areas', 'Status', 'Success Rate'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{list.slice(0, 6).map((x) => <tr key={x.id} className="border-t border-slate-100"><td className="py-3">{x.title}</td><td><Pill level={x.severity} label={sevLabel(x.severity)} /></td><td>{fmtDate(x.issuedAt)}</td><td>{x.areas.map((a: any) => a.name).join(', ')}</td><td>{x.status === 'ISSUED' ? 'Delivered' : 'Cancelled'}</td><td>{x.success}%</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
}
