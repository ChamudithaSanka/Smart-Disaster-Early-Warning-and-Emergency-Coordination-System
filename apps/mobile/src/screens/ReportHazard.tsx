import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { api, ApiError, uuid } from '../lib/api';
import { enqueue } from '../lib/queue';
import { Banner, Btn, Err, Field, Header, Label, LangPill, s } from '../lib/ui';
import { C } from '../lib/theme';

const CATS = ['Rising river', 'Blocked road', 'Landslide crack', 'Other'];
export default function ReportHazard({ onBack, onDone, net, lang, setLang }: any) {
  const [cat, setCat] = useState('Rising river'); const [desc, setDesc] = useState(''); const [photo, setPhoto] = useState<string | undefined>();
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null); const [gpsErr, setGpsErr] = useState(false); const [manual, setManual] = useState(false); const [place, setPlace] = useState('');
  const [captured, setCaptured] = useState(new Date()); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const getGps = async () => {
    setGpsErr(false);
    try {
      const p = await Location.requestForegroundPermissionsAsync(); if (p.status !== 'granted') throw new Error();
      const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 8000 });
      setGps({ lat: l.coords.latitude, lng: l.coords.longitude }); setCaptured(new Date());
    } catch { setGps(null); setGpsErr(true); }
  };
  useEffect(() => { getGps(); }, []);

  const takePhoto = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return setErr('Camera permission is needed to take a photo');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.3, base64: true }); // camera only - no gallery
    if (!r.canceled) setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
  };

  const submit = async () => {
    setErr('');
    if (!desc.trim()) return setErr('Please describe what you see');
    if (!gps && !place.trim()) return setErr('GPS is unavailable. Retry GPS or enter the location manually.');
    const clientId = uuid(); const body = { clientId, category: cat, description: desc, photo, lat: gps?.lat, lng: gps?.lng, locationText: place || undefined, capturedAt: captured.toISOString() };
    setBusy(true);
    try { const r = await api('/reports', body); onDone(`Report ${r.ref} submitted successfully`); }
    catch (e: any) {
      if (e instanceof ApiError && e.status === 0) { await enqueue({ clientId, path: '/reports', body, capturedAt: body.capturedAt }); await net.refresh(); onDone('No connection - report queued and will be sent automatically'); }
      else setErr(e.message);
    } finally { setBusy(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Report a hazard" onBack={onBack} right={<LangPill lang={lang} set={setLang} />} />
      <Banner {...net} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.label}>Category</Text>
        {CATS.map((c) => (
          <Pressable key={c} onPress={() => setCat(c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: cat === c ? C.teal : C.border, backgroundColor: cat === c ? C.tealSoft : '#fff', borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: cat === c ? C.teal : '#94a3b8', alignItems: 'center', justifyContent: 'center' }}>{cat === c && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal }} />}</View>
            <Text style={{ fontSize: 14 }}>{c}</Text>
          </Pressable>
        ))}
        <Label>Description</Label>
        <Field multiline placeholder="What do you see? (one or two lines)" value={desc} onChangeText={setDesc} />
        <Label>Photo</Label>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={takePhoto} style={{ width: 76, height: 76, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {photo ? <Image source={{ uri: photo }} style={{ width: 76, height: 76 }} /> : <><Text>📷</Text><Text style={{ fontSize: 11, fontWeight: '700' }}>Take photo</Text></>}
          </Pressable>
          <Text style={{ flex: 1, color: C.muted, fontSize: 12 }}>Taken with the phone camera; not chosen from the gallery</Text>
        </View>
        <Label>Location and time <Text style={{ fontWeight: '400', color: C.muted }}>captured automatically</Text></Label>
        <View style={[s.card, { backgroundColor: '#f8fafc' }]}>
          {gps ? <Text style={{ fontWeight: '700', color: C.teal, fontSize: 13 }}>📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</Text> : gpsErr ? <Text style={{ fontWeight: '700', color: C.warn, fontSize: 13 }}>⚠ GPS unavailable: no signal found</Text> : <Text style={{ color: C.muted }}>Getting GPS…</Text>}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 12 }}>Time {captured.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            <Text onPress={getGps} style={{ fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' }}>Retry GPS</Text>
          </View>
        </View>
        <Pressable onPress={() => setManual(!manual)} style={[s.btn, s.btnOutline, { marginTop: 10 }]}><Text style={{ fontSize: 13 }}>📍 Enter Location Manually ⌄</Text></Pressable>
        {manual && <><Field placeholder="Village, road or landmark" value={place} onChangeText={setPlace} /></>}
        <Err msg={err} />
        <Btn title={busy ? 'Submitting…' : 'Submit report'} onPress={submit} disabled={busy} />
      </ScrollView>
    </View>
  );
}
