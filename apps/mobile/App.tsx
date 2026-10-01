import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './src/lib/api';
import { useOnline } from './src/lib/useOnline';
import Login from './src/screens/Login';
import Home from './src/screens/Home';
import ReportHazard from './src/screens/ReportHazard';
import MyReports from './src/screens/MyReports';
import MyReport from './src/screens/MyReport';
import Shelter from './src/screens/Shelter';
import CentreFull from './src/screens/CentreFull';
import Team from './src/screens/Team';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });

async function registerPush() {
  if (!Device.isDevice) return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('alerts', { name: 'Hazard alerts', importance: Notifications.AndroidImportance.MAX, sound: 'default' });
  const p = await Notifications.requestPermissionsAsync(); if (!p.granted) return;
  try { const t = await Notifications.getExpoPushTokenAsync(); await api('/auth/push-token', { token: t.data }); } catch {}
}

export default function App() {
  const [user, setUser] = useState<any>(null); const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<{ name: string; id?: string; centre?: any; alts?: any[] }>({ name: 'home' }); const [lang, setLang] = useState('EN');
  const net = useOnline();
  useEffect(() => { AsyncStorage.getItem('token').then((t) => (t ? api('/auth/me').then(setUser).catch(() => {}) : null)).finally(() => setReady(true)); }, []);
  useEffect(() => { if (user) registerPush(); }, [user]);
  const logout = async () => { await AsyncStorage.removeItem('token'); setUser(null); setScreen({ name: 'home' }); };
  if (!ready) return <View />;
  const home = () => setScreen({ name: 'home' });
  let body;
  if (!user) body = <Login onLogin={setUser} />;
  else if (user.role === 'FIELD_RESPONDER') {
    // Screen depends on assignment: teamId → mission tracking, centreId → shelter occupancy
    if (user.centreId) body = screen.name === 'full' ? <CentreFull centre={screen.centre} alternatives={screen.alts} onBack={home} /> : <Shelter net={net} onLogout={logout} onFull={(centre: any, alts: any[]) => setScreen({ name: 'full', centre, alts })} />;
    else body = <Team net={net} onLogout={logout} />;
  }
  else if (user.role === 'CITIZEN') {
    body = screen.name === 'report' ? <ReportHazard net={net} lang={lang} setLang={setLang} onBack={home} onDone={(m: string) => { Alert.alert('Report', m); home(); }} />
      : screen.name === 'mine' ? <MyReports lang={lang} setLang={setLang} onBack={home} onOpen={(id: string) => setScreen({ name: 'detail', id })} />
      : screen.name === 'detail' ? <MyReport id={screen.id} lang={lang} setLang={setLang} onBack={() => setScreen({ name: 'mine' })} />
      : <Home user={user} net={net} lang={lang} setLang={setLang} go={(n: string) => setScreen({ name: n })} onLogout={logout} />;
  } else body = <Login onLogin={setUser} />;
  return <View style={{ flex: 1 }}><StatusBar style="light" />{body}</View>;
}
