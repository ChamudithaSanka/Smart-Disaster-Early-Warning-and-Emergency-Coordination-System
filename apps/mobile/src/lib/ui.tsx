import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { C } from './theme';

export const Header = ({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) => (
  <View style={s.header}>
    <Pressable onPress={onBack} disabled={!onBack}><Text style={s.headerTitle}>{onBack ? '‹ ' : ''}{title}</Text></Pressable>
    {right}
  </View>
);
export const LangPill = ({ lang, set }: { lang: string; set: (l: string) => void }) => (
  <Pressable onPress={() => set(lang === 'EN' ? 'SI' : lang === 'SI' ? 'TA' : 'EN')} style={s.pill}><Text style={s.pillText}>{lang} ▾</Text></Pressable>
);
export const Btn = ({ title, onPress, outline, disabled }: { title: string; onPress: () => void; outline?: boolean; disabled?: boolean }) => (
  <Pressable disabled={disabled} onPress={onPress} style={[s.btn, outline ? s.btnOutline : s.btnDark, disabled && { opacity: 0.6 }]}><Text style={[s.btnText, outline && { color: C.text }]}>{title}</Text></Pressable>
);
export const Label = ({ children }: { children: ReactNode }) => <Text style={s.label}>{children}</Text>;
export const Field = (p: TextInputProps) => <TextInput placeholderTextColor="#94a3b8" {...p} style={[s.input, p.multiline && { height: 90, textAlignVertical: 'top' }]} />;
export const Err = ({ msg }: { msg?: string }) => msg ? <View style={s.err}><Text style={{ color: C.red, fontSize: 13 }}>{msg}</Text></View> : null;
export const Banner = ({ online, pending, note }: { online: boolean; pending: number; note?: string }) => (
  <View style={[s.banner, !online && { backgroundColor: '#fde8e8' }]}>
    <Text style={{ fontSize: 12, color: online ? '#7a5b00' : C.red }}>{online ? '▂▄▆ Online - reports send right away' : `Offline - ${pending} item(s) queued, will sync when connected`}</Text>
    {!!note && <Text style={{ fontSize: 11, color: C.teal }}>{note}</Text>}
  </View>
);
export const s = StyleSheet.create({
  header: { backgroundColor: C.navy, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pill: { borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  btn: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  btnDark: { backgroundColor: C.navy }, btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label: { fontSize: 12, fontWeight: '700', color: C.text, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: '#fff', padding: 12, fontSize: 14, color: C.text },
  err: { backgroundColor: '#fdecec', borderRadius: 8, padding: 10, marginTop: 10 },
  banner: { backgroundColor: C.cream, paddingHorizontal: 16, paddingVertical: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 },
});
