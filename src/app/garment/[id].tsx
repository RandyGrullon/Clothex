import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Garment3D } from '@/components/garment-3d';
import { Button, Card, Chip, ColorDots, Row } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { deleteGarment, getGarment } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { categoryLabel, styleLabel, type Garment } from '@/lib/types';

export default function GarmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [garment, setGarment] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGarment(id).then((g) => {
      setGarment(g);
      setLoading(false);
    });
  }, [id]);

  const remove = () => {
    const doDelete = async () => {
      await deleteGarment(id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar esta prenda del closet?')) void doDelete();
    } else {
      Alert.alert('Eliminar prenda', '¿Seguro que quieres eliminarla?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void doDelete() },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.ink} />
      </View>
    );
  }
  if (!garment) {
    return (
      <View style={s.center}>
        <Text style={font.body}>Prenda no encontrada</Text>
      </View>
    );
  }

  const uri = garment.cutout_url ?? garment.image_url ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button title="←" onPress={() => router.back()} variant="ghost" small />
          <Text style={font.small}>Arrastra para girar en 3D</Text>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <Garment3D uri={uri} size={290} />
        </View>

        <Text style={font.title}>{garment.name}</Text>
        <View style={[s.wrap, { marginTop: 10 }]}>
          {(garment.styles ?? []).map((st) => (
            <Chip key={st} label={styleLabel(st)} active />
          ))}
        </View>

        <Card style={{ marginTop: 20 }}>
          <Row label="Categoría" value={categoryLabel(garment.category)} />
          {garment.subtype ? <Row label="Tipo" value={garment.subtype} /> : null}
          {garment.material ? <Row label="Material / tela" value={garment.material} /> : null}
          {garment.pattern ? <Row label="Patrón" value={garment.pattern} /> : null}
          {garment.fit ? <Row label="Corte" value={garment.fit} /> : null}
          {garment.seasons?.length ? <Row label="Temporada" value={garment.seasons.join(', ')} /> : null}
          <View style={{ paddingTop: 12, gap: 8 }}>
            <Text style={font.label}>Colores</Text>
            <ColorDots colors={garment.colors ?? []} size={20} />
          </View>
        </Card>

        {garment.description ? (
          <Text style={[font.body, { marginTop: 16 }]}>{garment.description}</Text>
        ) : null}

        {profile ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={[font.label, { marginBottom: 4 }]}>Dueño</Text>
            <Row label="Altura" value={profile.height_cm ? `${profile.height_cm} cm` : '—'} />
            <Row label="Peso" value={profile.weight_kg ? `${profile.weight_kg} kg` : '—'} />
            <Row
              label="Tallas"
              value={[profile.shirt_size, profile.pants_size, profile.shoe_size]
                .filter(Boolean)
                .join(' · ') || '—'}
            />
          </Card>
        ) : null}

        <View style={{ gap: 10, marginTop: 24 }}>
          <Button
            title="🧍  Ver en el maniquí"
            onPress={() => router.push(`/(tabs)/mannequin?wear=${garment.id}`)}
          />
          <Button title="Eliminar prenda" onPress={remove} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
