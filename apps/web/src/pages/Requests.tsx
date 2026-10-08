import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Pill, fmtTime } from '../components/ui';
import MapView from '../components/MapView';

export default function Requests() {
  const [list, setList] = useState<any[]>([]); const [tab, setTab] = useState('Requests'); const nav = useNavigate();
  useEffect(() => { api('/rescue/requests').then(setList); }, []);
  return (
    <div>
      <h1 className="mb-3 text-[22px] font-bold">Incoming Rescue Requests</h1>
      <div className="mb-3 flex gap-5 text-xs font-semibold">{['Requests', 'Map View'].map((t) => <button key={t} onClick={() => setTab(t)} className={`border-b-2 pb-1 ${tab === t ? 'border-teal' : 'border-transparent text-slate-500'}`}>{t}</button>)}</div>
      {tab === 'Requests' ? (
        <table className="w-full text-[13px]"><thead><tr className="border-b border-slate-200">{['PRIORITY', 'TYPE', 'LOCATION', 'TIME', 'ACTION'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id} className="border-b border-slate-100"><td className="py-3"><Pill level={r.priority} label={r.priority} /></td><td>{r.type}</td><td>{r.location}</td><td>{fmtTime(r.createdAt)}</td>
              <td><button className="btn-teal px-4 py-1.5" onClick={() => nav(`/ops/requests/${r.id}`)}>Dispatch ↗</button></td></tr>))}</tbody></table>
      ) : <Card><MapView height={420} points={list.map((r) => ({ lat: r.lat, lng: r.lng, label: `${r.priority} · ${r.type}`, color: r.priority === 'HIGH' ? '#dc2626' : '#d97706' }))} /></Card>}
    </div>
  );
}
