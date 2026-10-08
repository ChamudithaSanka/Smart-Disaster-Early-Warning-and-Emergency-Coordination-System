import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardTitle, Err } from '../components/ui';

export function Approvals() {
  const [list, setList] = useState<any[]>([]); const [err, setErr] = useState('');
  const load = () => api('/rescue/approvals').then(setList);
  useEffect(() => { load(); }, []);
  const decide = async (id: string, accept: boolean) => { setErr(''); try { await api(`/rescue/dispatches/${id}/decision`, { body: { accept } }); load(); } catch (e: any) { setErr(e.message); } };
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Dispatch Approvals</h1><Err msg={err} />
      <Card>{list.length === 0 && <p className="text-sm text-slate-500">No pending requests.</p>}
        {list.map((d) => <div key={d.id} className="flex items-center justify-between border-b border-slate-100 py-3 text-[13px] last:border-0"><div><b>{d.team.name}</b> → {d.request.type} · {d.request.location}<div className="text-xs text-slate-500">ETA {d.eta}</div></div><div className="flex gap-2"><button className="btn-teal px-4 py-1.5" onClick={() => decide(d.id, true)}>Accept</button><button className="btn px-4 py-1.5" onClick={() => decide(d.id, false)}>Decline</button></div></div>)}
      </Card></div>
  );
}

export function Relief() {
  const [stock, setStock] = useState<any[]>([]); const [centres, setCentres] = useState<any[]>([]); const [areas, setAreas] = useState<any[]>([]);
  const [item, setItem] = useState(''); const [qty, setQty] = useState(''); const [rcv, setRcv] = useState(''); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const load = () => api('/relief/stock').then((s) => { setStock(s); if (!item && s[0]) setItem(s[0].item); });
  useEffect(() => { load(); api('/centres').then(setCentres); api('/areas').then(setAreas); }, []);
  const cur = stock.find((s) => s.item === item); const n = Number(qty);
  const invalid = cur && qty && n > cur.quantity;
  const submit = async () => {
    setErr(''); setOk('');
    const [kind, id] = rcv.split(':');
    try { await api('/relief/distributions', { body: { item, quantity: n, [kind === 'c' ? 'centreId' : 'areaId']: id } }); setOk('Distribution recorded.'); setQty(''); load(); } catch (e: any) { setErr(e.message); load(); }
  };
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Log Relief Distribution</h1><Err msg={err} />{ok && <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>Distribution</CardTitle>
          <label className="lbl">Receiver (Centre / GN Division)</label>
          <select className="inp mb-3" value={rcv} onChange={(e) => setRcv(e.target.value)}><option value="">Select…</option><optgroup label="Safety centres">{centres.map((c) => <option key={c.id} value={`c:${c.id}`}>{c.name}</option>)}</optgroup><optgroup label="GN Divisions">{areas.map((a) => <option key={a.id} value={`a:${a.id}`}>{a.name}</option>)}</optgroup></select>
          <label className="lbl">Item</label><select className="inp mb-3" value={item} onChange={(e) => setItem(e.target.value)}>{stock.map((s) => <option key={s.id}>{s.item}</option>)}</select>
          <label className="lbl">Quantity</label><input type="number" className={`inp ${invalid ? '!border-red-500' : ''}`} value={qty} onChange={(e) => setQty(e.target.value)} />
          {invalid && <div className="mt-1 text-xs text-red-600">Insufficient stock — only {cur.quantity} {cur.unit} available.</div>}
          <button disabled={!rcv || !qty || invalid} className="btn-teal mt-4 w-full" onClick={submit}>Confirm Distribution</button>
        </Card>
        <Card><CardTitle>Stock</CardTitle>
          <div className="space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-slate-500">Available Stock</span><b>{cur ? `${cur.quantity} ${cur.unit}` : '–'}</b></div><div className="flex justify-between"><span className="text-slate-500">Remaining after distribution</span><b>{cur && qty && !invalid ? `${cur.quantity - n} ${cur.unit}` : '–'}</b></div></div>
        </Card>
      </div>
    </div>
  );
}
