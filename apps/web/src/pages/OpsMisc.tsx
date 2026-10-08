import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui';
import MapView from '../components/MapView';

export function Teams() {
  const [t, setT] = useState<any[]>([]);
  useEffect(() => { api('/rescue/teams').then(setT); }, []);
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Teams</h1>
      <Card><table className="w-full text-[13px]"><thead><tr>{['Team', 'Organisation', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{t.map((x) => <tr key={x.id} className="border-t border-slate-100"><td className="py-3 font-semibold">{x.name}</td><td>{x.org.name}</td><td>{x.status}</td></tr>)}</tbody></table></Card></div>
  );
}
export function OpsMap() {
  const [t, setT] = useState<any[]>([]); const [r, setR] = useState<any[]>([]); const [c, setC] = useState<any[]>([]);
  useEffect(() => { api('/rescue/teams').then(setT); api('/rescue/requests').then(setR); api('/centres').then(setC); }, []);
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Operational Map</h1>
      <Card><MapView height={520} points={[...t.map((x) => ({ lat: x.lat, lng: x.lng, label: x.name, color: '#0b6f82' })), ...r.map((x) => ({ lat: x.lat, lng: x.lng, label: x.type, color: '#dc2626' })), ...c.map((x) => ({ lat: x.lat, lng: x.lng, label: x.name, color: '#7c3aed', r: 6 }))]} /><div className="mt-2 text-xs text-slate-500">Teal: rescue teams · Red: rescue requests · Purple: safety centres</div></Card></div>
  );
}
