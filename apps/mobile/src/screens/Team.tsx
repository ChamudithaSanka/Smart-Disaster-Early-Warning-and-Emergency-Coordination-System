import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api, ApiError, uuid } from '../lib/api';
import { enqueue } from '../lib/queue';
import { Banner, Btn, Err, Header, s } from '../lib/ui';
import { C } from '../lib/theme';

const STEPS: [string, string][] = [['EN_ROUTE', 'En Route'], ['ON_SITE', 'On Site'], ['RETURNING', 'Returning']];
export default function Team({ net, onLogout }: any) {
  const [d, setD] = useState<any>(null); const [loaded, setLoaded] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const load = () => api('/rescue/my-dispatch').then((x) => { setD(x); setLoaded(true); }).catch((e) => { setErr(e.message); setLoaded(true); });
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const send = async (status: string) => {
    setErr(''); setMsg('');
    const body = { status, clientId: uuid(), capturedAt: new Date().toISOString() };
    try { await api(`/rescue/dispatches/${d.id}/status`, body); load(); }
    catch (e: any) {
      if (e instanceof ApiError && e.status === 0) { await enqueue({ clientId: body.clientId, path: `/rescue/dispatches/${d.id}/status`, body, capturedAt: body.capturedAt }); await net.refresh(); setMsg('Offline - status queued and will sync in order.'); }
      else setErr(e.message);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Rescue Team" right={<Text onPress={onLogout} style={{ color: '#fff', fontSize: 12 }}>Log out</Text>} />
      <Banner {...net} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Err msg={err} />
        {loaded && !d && <Text style={{ color: C.muted }}>No active assignment. New dispatches appear here once approved.</Text>}
        {d && (
          <View style={s.card}>
            <Text style={{ fontSize: 18, fontWeight: '800' }}>{d.request.type}</Text>
            <Text style={{ marginTop: 4 }}>📍 {d.request.location}</Text><Text style={{ marginTop: 4, color: C.muted, fontSize: 13 }}>{d.request.details}</Text>
            <Text style={{ marginTop: 8, fontSize: 13 }}>Contact: {d.request.contact} · ETA {d.eta}</Text>
            <Text style={{ marginTop: 8, fontWeight: '700' }}>Mission status: {d.status.replace('_', ' ')}</Text>
            {STEPS.map(([k, l]) => <Btn key={k} title={l} outline={d.status !== k} onPress={() => send(k)} />)}
            <Btn title="Confirm Mission Completed" onPress={() => send('COMPLETED')} disabled={!['ON_SITE', 'RETURNING'].includes(d.status)} />
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>"Returning" does not complete the mission. Confirm completion once the mission has concluded.</Text>
          </View>
        )}
        {!!msg && <Text style={{ color: C.teal, marginTop: 12 }}>{msg}</Text>}
      </ScrollView>
    </View>
  );
}
