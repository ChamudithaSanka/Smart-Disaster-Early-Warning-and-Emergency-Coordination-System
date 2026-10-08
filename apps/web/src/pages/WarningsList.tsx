import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Pill, sevLabel, fmtDate, Err } from '../components/ui';

export default function WarningsList() {
  const [list, setList] = useState<any[]>([]); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const load = () => api('/warnings').then(setList);
  useEffect(() => { load(); }, []);
  const act = async (id: string, what: 'retry' | 'cancel') => {
    setErr(''); setMsg('');
    try { const r = await api(`/warnings/${id}/${what}`, { method: 'POST' }); setMsg(what === 'retry' ? `Retried ${r.retried} failed alerts, ${r.delivered} delivered.` : 'Warning cancelled and citizens notified.'); load(); } catch (e: any) { setErr(e.message); }
  };
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Warnings</h1><Err msg={err} />{msg && <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
      <Card><table className="w-full text-[13px]"><thead><tr>{['Code', 'Title', 'Severity', 'Issued', 'Areas', 'Status', 'Failed', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{list.map((w) => (
          <tr key={w.id} className="border-t border-slate-100"><td className="py-3 font-semibold">{w.code}</td><td>{w.title}</td><td><Pill level={w.severity} label={sevLabel(w.severity)} /></td><td>{fmtDate(w.issuedAt)}</td><td>{w.areas.map((a: any) => a.name).join(', ')}</td><td>{w.status}</td><td>{w.failed}</td>
            <td className="space-x-2 text-right">{w.status === 'ISSUED' && <><button className="btn px-3 py-1.5" onClick={() => act(w.id, 'retry')}>Retry failed</button><button className="btn px-3 py-1.5 text-red-600" onClick={() => act(w.id, 'cancel')}>Cancel</button></>}</td></tr>
        ))}</tbody></table></Card></div>
  );
}
