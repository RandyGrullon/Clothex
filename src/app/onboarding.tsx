import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { upsertProfile } from '@/lib/data';
import { font, T } from '@/lib/theme';

const GENDERS = ['Hombre', 'Mujer', 'Otro'];

export default function Onboarding() {
  const { session, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [gender, setGender] = useState(profile?.gender ?? 'Hombre');
  const [height, setHeight] = useState(profile?.height_cm?.toString() ?? '');
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() ?? '');
  const [chest, setChest] = useState(profile?.chest_cm?.toString() ?? '');
  const [waist, setWaist] = useState(profile?.waist_cm?.toString() ?? '');
  const [hips, setHips] = useState(profile?.hips_cm?.toString() ?? '');
  const [shirt, setShirt] = useState(profile?.shirt_size ?? '');
  const [pants, setPants] = useState(profile?.pants_size ?? '');
  const [shoe, setShoe] = useState(profile?.shoe_size ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const num = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);

  const save = async () => {
    if (!session) return;
    if (!num(height) || !num(weight)) {
      setError('Altura y peso son obligatorios: la IA los usa para el maniquí.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await upsertProfile({
        id: session.user.id,
        display_name: name.trim() || null,
        gender,
        height_cm: num(height),
        weight_kg: num(weight),
        chest_cm: num(chest),
        waist_cm: num(waist),
        hips_cm: num(hips),
        shirt_size: shirt.trim() || null,
        pants_size: pants.trim() || null,
        shoe_size: shoe.trim() || null,
      });
      await refreshProfile();
      router.replace('/(tabs)/closet');
    } catch (e: any) {
      setError(e.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={font.title}>Sobre ti</Text>
        <Text style={[font.body, { marginTop: 6, marginBottom: 24 }]}>
          Tus medidas ajustan el maniquí y ayudan a la IA a recomendarte outfits.
        </Text>
        <View style={{ gap: 16 }}>
          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
          <View style={{ gap: 6 }}>
            <Text style={font.label}>Género</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {GENDERS.map((g) => (
                <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} />
              ))}
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Altura (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Peso (kg)" value={weight} onChangeText={setWeight} placeholder="72" keyboardType="numeric" />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Pecho (cm)" value={chest} onChangeText={setChest} placeholder="98" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Cintura (cm)" value={waist} onChangeText={setWaist} placeholder="82" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Cadera (cm)" value={hips} onChangeText={setHips} placeholder="96" keyboardType="numeric" />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Talla camisa" value={shirt} onChangeText={setShirt} placeholder="M" autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Talla pantalón" value={pants} onChangeText={setPants} placeholder="32" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Calzado" value={shoe} onChangeText={setShoe} placeholder="42" />
            </View>
          </View>
          {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
          <Button title="Continuar" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { padding: 28, paddingBottom: 60 },
  row2: { flexDirection: 'row', gap: 10 },
});
