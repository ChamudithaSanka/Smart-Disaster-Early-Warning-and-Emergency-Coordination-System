import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../lib/api';
import { Header, Err, LangPill, s } from '../lib/ui';
import { C } from '../lib/theme';

export const STATUS_LABEL: any = { SUBMITTED: 'SUBMITTED', UNDER_REVIEW: 'UNDER REVIEW', NEEDS_MORE_INFO: 'NEEDS MORE INFORMATION', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' };
export default function MyReports({ onBack, onOpen, lang, setLang }: any) {
  const [list, setList] = useState<any[]>([]); const [err, setErr] = useState('');
  useEffect(() => { api('/reports/mine').then(setList).catch((e) => setErr(e.message)); }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="My reports" onBack={onBack} right={<LangPill lang={lang} set={setLang} />} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Err msg={err} />
        {list.length === 0 && !err && <Text style={{ color: C.muted }}>You have not submitted any reports yet.</Text>}
        {list.map((r) => (
          <Pressable key={r.id} onPress={() => onOpen(r.id)} style={[s.card, { marginBottom: 10 }]}>
            <Text style={{ fontWeight: '700' }}>{r.ref} · {r.category}</Text>
            <Text style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: r.status === 'NEEDS_MORE_INFO' ? C.tealSoft : '#eef2f7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, fontWeight: '600' }}>{STATUS_LABEL[r.status]}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
