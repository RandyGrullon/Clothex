import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip } from '@/components/ui';
import { deleteOutfit, getOutfit, listGarments } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { styleLabel, type Garment, type Outfit } from '@/lib/types';

export default function OutfitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOutfit(id), listGarments()]).then(([o, g]) => {
      setOutfit(o);
      setGarments(g);
      setLoading(false);
    });
  }, [id]);

  const pics = useMemo(() => {
    const byId = new Map(garments.map((g) => [g.id, g]));
    return (outfit?.garment_ids ?? []).map((gid) => byId.get(gid)).filter(Boolean) as Garment[];
  }, [outfit, garments]);

  const remove = () => {
    const doDelete = async () => {
      await deleteOutfit(id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar este outfit?')) void doDelete();
    } else {
      Alert.alert('Eliminar outfit', '¿Seguro?', [
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
  if (!outfit) {
    return (
      <View style={s.center}>
        <Text style={font.body}>Outfit no encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Button title="←" onPress={() => router.back()} variant="ghost" small />
        <Text style={[font.title, { marginTop: 16 }]}>{outfit.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Chip label={styleLabel(outfit.style)} active />
          {outfit.score != null ? (
            <Text style={{ color: T.gold, fontWeight: '800' }}>{outfit.score}/10</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {pics.map((g) => (
            <View key={g.id} style={s.thumb}>
              <Image
                source={{ uri: g.cutout_url ?? g.image_url ?? undefined }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
              <Text numberOfLines={1} style={[font.small, { textAlign: 'center', marginTop: 4 }]}>
                {g.name}
              </Text>
            </View>
          ))}
        </View>

        {outfit.reason ? (
          <Card style={{ marginTop: 20 }}>
            <Text style={[font.label, { marginBottom: 6 }]}>Por qué combina</Text>
            <Text style={font.body}>{outfit.reason}</Text>
          </Card>
        ) : null}

        <View style={{ gap: 10, marginTop: 24 }}>
          <Button
            title="🧍  Ver en el maniquí"
            onPress={() => router.push(`/(tabs)/mannequin?outfit=${outfit.id}`)}
          />
          <Button title="Eliminar outfit" onPress={remove} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg },
  thumb: {
    width: '30.5%',
    aspectRatio: 0.85,
    backgroundColor: T.surfaceSoft,
    borderRadius: 14,
    padding: 6,
  },
});
