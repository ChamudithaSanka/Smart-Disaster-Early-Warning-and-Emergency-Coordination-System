import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui';
import MapView from '../components/MapView';

export default function Areas() {
  const [a, setA] = useState<any[]>([]);
  useEffect(() => { api('/areas').then(setA); }, []);
  return (
    <div><h1 className="mb-4 text-[22px] font-bold">Areas</h1>
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <Card><table className="w-full text-[13px]"><thead><tr><th className="th">Area</th><th className="th">District</th><th className="th">Registered citizens</th></tr></thead><tbody>{a.map((x) => <tr key={x.id} className="border-t border-slate-100"><td className="py-3">{x.name}</td><td>{x.district}</td><td>{x.citizens}</td></tr>)}</tbody></table></Card>
        <Card><MapView height={380} zones={a.map((x) => ({ lat: x.lat, lng: x.lng, radiusKm: x.radiusKm, label: x.name }))} /></Card>
      </div>
    </div>
  );
}
