import { ScrollView, Text, View } from 'react-native';
import { Btn, Header, s } from '../lib/ui';
import { C } from '../lib/theme';

export default function CentreFull({ centre, alternatives, onBack }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Centre Full" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff4e5', borderLeftWidth: 4, borderLeftColor: '#f59e0b', padding: 12, borderRadius: 8 }}><Text style={{ fontWeight: '700' }}>⚠ {centre.name} is full ({centre.occupancy}/{centre.capacity})</Text><Text style={{ marginTop: 4, fontSize: 13 }}>Redirect arriving families to a nearby active centre.</Text></View>
        <Text style={{ fontWeight: '700', marginTop: 18, marginBottom: 8 }}>Nearby active centres</Text>
        {alternatives.length === 0 && <Text style={{ color: C.muted }}>No active centre with spare capacity was found. The District Officer has been alerted to activate another centre.</Text>}
        {alternatives.map((a: any) => (
          <View key={a.id} style={[s.card, { marginBottom: 10 }]}><Text style={{ fontWeight: '700' }}>{a.name}</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{a.address} · {a.distanceKm} km · {a.remaining} places remaining</Text><Btn title="Select Centre" onPress={onBack} /></View>
        ))}
      </ScrollView>
    </View>
  );
}
