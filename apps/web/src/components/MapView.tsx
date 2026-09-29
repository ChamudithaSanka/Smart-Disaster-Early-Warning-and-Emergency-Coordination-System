import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

export interface Pt { lat: number; lng: number; color?: string; label?: string; r?: number; fill?: string }
function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 }); else if (pts.length === 1) map.setView(pts[0], 13); }, [JSON.stringify(pts)]);
  return null;
}
export default function MapView({ points = [], zones = [], route, height = 260 }: { points?: Pt[]; zones?: { lat: number; lng: number; radiusKm: number; label?: string }[]; route?: [number, number][]; height?: number }) {
  const all: [number, number][] = [...points.map((p) => [p.lat, p.lng] as [number, number]), ...zones.map((z) => [z.lat, z.lng] as [number, number])];
  return (
    <MapContainer center={all[0] || [7.87, 80.77]} zoom={all.length ? 11 : 7} style={{ height, borderRadius: 10 }} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {zones.map((z, i) => <Circle key={i} center={[z.lat, z.lng]} radius={z.radiusKm * 1000} pathOptions={{ color: '#475569', fillColor: '#64748b', fillOpacity: 0.2, weight: 1 }}>{z.label && <Tooltip permanent direction="top">{z.label}</Tooltip>}</Circle>)}
      {route && <Polyline positions={route} pathOptions={{ color: '#111', dashArray: '6 8', weight: 3 }} />}
      {points.map((p, i) => (
        <CircleMarker key={i} center={[p.lat, p.lng]} radius={p.r || 8} pathOptions={{ color: p.color || '#111', fillColor: p.fill || p.color || '#111', fillOpacity: 1, weight: 2 }}>
          {p.label && <Tooltip permanent direction="right">{p.label}</Tooltip>}
        </CircleMarker>
      ))}
      <Fit pts={all} />
    </MapContainer>
  );
}
