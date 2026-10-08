import { useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { Btn, Err, Field, Header, Label } from '../lib/ui';
import { C } from '../lib/theme';

const DEMO = [['citizen@demo.lk', 'Citizen'], ['volunteer@demo.lk', 'Volunteer'], ['shelter@demo.lk', 'Shelter'], ['leader@demo.lk', 'Team leader']];
export default function Login({ onLogin }: { onLogin: (u: any) => void }) {
  const [email, setEmail] = useState('citizen@demo.lk'); const [pw, setPw] = useState('Password123!'); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    try { const r = await api('/auth/login', { email, password: pw }); await AsyncStorage.setItem('token', r.token); onLogin(r.user); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="DMC Disaster Alerts" />
      <View style={{ padding: 20 }}>
        <Err msg={err} />
        <Label>Email</Label><Field value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Label>Password</Label><Field value={pw} onChangeText={setPw} secureTextEntry />
        <Btn title={busy ? 'Signing in…' : 'Sign in'} onPress={go} disabled={busy} />
        <Text style={{ marginTop: 18, color: C.muted, fontSize: 12 }}>Demo accounts (tap to fill):</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {DEMO.map(([m, l]) => <Text key={m} onPress={() => setEmail(m)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, fontSize: 12 }}>{l}</Text>)}
        </View>
      </View>
    </View>
  );
}
