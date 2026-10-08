import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api, ApiError, uuid } from '../lib/api';
import { enqueue } from '../lib/queue';
import { Banner, Err, s } from '../lib/ui';
import { C } from '../lib/theme';

export default function Shelter({ net, onLogout, onFull }: any) {
  const [c, setC] = useState<any>(null); const [n, setN] = useState(0); const [lang, setLang] = useState('EN'); const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { api('/centres/mine').then((x) => { setC(x); setN(x.occupancy); }).catch((e) => setErr(e.message)); }, []);
  if (!c) return <View style={{ flex: 1, padding: 40 }}><Err msg={err} /></View>;
  const pct = Math.round((n / c.capacity) * 100);
  const save = async () => {
    setErr(''); setMsg(''); setBusy(true);
    const body = { clientId: uuid(), headcount: n, families: c.families, capturedAt: new Date().toISOString() };
    try {
      const r = await api(`/centres/${c.id}/occupancy`, body); setC(r.centre); setMsg('Occupancy saved.');
      if (r.full) onFull(r.centre, r.alternatives);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 0) { await enqueue({ clientId: body.clientId, path: `/centres/${c.id}/occupancy`, body, capturedAt: body.capturedAt }); await net.refresh(); setMsg(`Offline - update queued. Last known remaining capacity: ${c.capacity - c.occupancy}`); }
      else if (e instanceof ApiError && e.data?.full) onFull(e.data.centre, e.data.alternatives);
      else setErr(e.message + (e.data?.conflict ? ' — occupancy information requires review.' : ''));
    } finally { setBusy(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Banner {...net} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 50 }}>
        <View style={[s.card, { padding: 22 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
            {['SI', 'TA', 'EN'].map((l, i) => <Text key={l} onPress={() => setLang(l)} style={{ fontSize: 12, color: C.muted, fontWeight: lang === l ? '800' : '400' }}>{l}{i < 2 ? ' / ' : ''}</Text>)}
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>Shelter Operator</Text>
          <Text style={{ fontWeight: '700', marginTop: 16 }}>Capacity — {c.name}</Text>
          <View style={{ height: 22, borderRadius: 11, backgroundColor: '#eef2f7', borderWidth: 1, borderColor: C.border, marginTop: 8, overflow: 'hidden' }}><View style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: C.teal }} /></View>
          <Text style={{ color: C.muted, marginTop: 4 }}>{n} / {c.capacity} ({pct}%)</Text>
          <Text style={{ fontWeight: '700', marginTop: 18 }}>Headcount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Pressable onPress={() => setN(Math.max(0, n - 1))} style={{ width: 90, height: 64, borderWidth: 1, borderColor: C.text, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32 }}>−</Text></Pressable>
            <Text style={{ fontSize: 44, fontWeight: '800' }}>{n}</Text>
            <Pressable onPress={() => setN(n + 1)} style={{ width: 90, height: 64, borderWidth: 1, borderColor: C.text, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32 }}>+</Text></Pressable>
          </View>
          <Err msg={err} />{!!msg && <Text style={{ color: C.teal, marginTop: 10 }}>{msg}</Text>}
          <Pressable disabled={busy} onPress={save} style={{ backgroundColor: C.navy, borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginTop: 18, opacity: busy ? 0.6 : 1 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save</Text></Pressable>
          <Text style={{ color: C.muted, marginTop: 14, fontSize: 13 }}>Saving at full capacity opens the Centre Full redirect screen.</Text>
        </View>
        <Text onPress={onLogout} style={{ textAlign: 'center', color: C.muted, marginTop: 18 }}>Log out</Text>
      </ScrollView>
    </View>
  );
}
