import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../lib/api';
import { Btn, Err, Field, Header, Label, LangPill, s } from '../lib/ui';
import { STATUS_LABEL } from './MyReports';
import { C } from '../lib/theme';

export default function MyReport({ id, onBack, lang, setLang }: any) {
  const [r, setR] = useState<any>(null); const [info, setInfo] = useState(''); const [photo, setPhoto] = useState<string | undefined>(); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => { api(`/reports/${id}`).then(setR).catch((e) => setErr(e.message)); }, [id]);
  const pick = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return;
    const x = await ImagePicker.launchCameraAsync({ quality: 0.3, base64: true }); if (!x.canceled) setPhoto(`data:image/jpeg;base64,${x.assets[0].base64}`);
  };
  const submit = async () => {
    setErr('');
    try { const x = await api(`/reports/${id}/info`, { info, photo }); setR(x); setOk('Your information was added to the existing report.'); setInfo(''); } catch (e: any) { setErr(e.message); }
  };
  if (!r) return <View style={{ flex: 1 }}><Header title="My report" onBack={onBack} /><Err msg={err} /></View>;
  const needs = r.status === 'NEEDS_MORE_INFO';
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="My report" onBack={onBack} right={<LangPill lang={lang} set={setLang} />} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{r.ref} · {r.category}</Text>
        <Text style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border, backgroundColor: '#eef4fb', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, fontSize: 11, fontWeight: '700' }}>{STATUS_LABEL[r.status]}</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Reported by {r.reporter?.name} at {new Date(r.capturedAt).toLocaleString('en-GB')}.</Text>
        <Text style={{ marginTop: 8, fontSize: 14 }}>{r.description}</Text>
        {r.status === 'REJECTED' && <Text style={{ marginTop: 10, color: C.red }}>Rejected: {r.decisionNote}</Text>}
        {r.status === 'VERIFIED' && <Text style={{ marginTop: 10, color: C.teal }}>Verified by the DMC duty officer. Thank you.</Text>}
        {needs && (
          <>
            <Label>Officer's question</Label>
            <View style={{ backgroundColor: C.tealSoft, borderRadius: 12, padding: 14 }}><Text style={{ fontSize: 14 }}>{r.officerQuestion}</Text></View>
            <Label>Your additional information</Label>
            <Field multiline placeholder="Enter additional information..." value={info} onChangeText={setInfo} />
            <Label>Attach photo <Text style={{ fontWeight: '400', color: C.muted }}>(optional)</Text></Label>
            <View style={[s.card, { padding: 12 }]}><Text onPress={pick} style={{ fontSize: 13 }}>{photo ? '✔ Photo attached' : '🖼 Attach photo (optional)'}</Text>{photo && <Image source={{ uri: photo }} style={{ width: 80, height: 80, marginTop: 8, borderRadius: 8 }} />}</View>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Adding information will update the existing report and will not create a new report.</Text>
            <Err msg={err} />
            <Btn title="Add Information to Report" onPress={submit} />
          </>
        )}
        {!!ok && <Text style={{ marginTop: 14, color: C.teal }}>{ok}</Text>}
      </ScrollView>
    </View>
  );
}
