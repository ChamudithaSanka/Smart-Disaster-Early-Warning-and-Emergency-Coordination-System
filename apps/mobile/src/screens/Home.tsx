import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../lib/api';
import { Banner, Btn, Header, LangPill, s } from '../lib/ui';
import { C } from '../lib/theme';

export default function Home({ user, net, lang, setLang, go, onLogout }: any) {
  const [alerts, setAlerts] = useState<any[]>([]);
  useEffect(() => { api('/alerts/mine').then(setAlerts).catch(() => {}); }, []);
  const seen = new Set(); const uniq = alerts.filter((a) => (seen.has(a.warningId) ? false : seen.add(a.warningId)));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title={`Hello, ${user.name.split(' ')[0]}`} right={<LangPill lang={lang} set={setLang} />} />
      <Banner {...net} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Btn title="Report a hazard" onPress={() => go('report')} />
        <Btn title="My reports" outline onPress={() => go('mine')} />
        <Text style={s.label}>Warnings for your area</Text>
        {uniq.length === 0 && <Text style={{ color: C.muted }}>No warnings received.</Text>}
        {uniq.map((a) => (
          <View key={a.id} style={[s.card, { marginBottom: 10, borderLeftWidth: 4, borderLeftColor: a.warning.severity === 'HIGH' ? C.red : a.warning.severity === 'MEDIUM' ? '#f59e0b' : '#eab308' }]}>
            <Text style={{ fontWeight: '700' }}>{a.warning.title}</Text><Text style={{ fontSize: 13, marginTop: 4 }}>{a.warning.description}</Text>
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{new Date(a.warning.issuedAt).toLocaleString('en-GB')} · Valid until {new Date(a.warning.validUntil).toLocaleString('en-GB')}</Text>
          </View>
        ))}
        <Text onPress={onLogout} style={{ textAlign: 'center', color: C.muted, marginTop: 20 }}>Log out</Text>
      </ScrollView>
    </View>
  );
}
