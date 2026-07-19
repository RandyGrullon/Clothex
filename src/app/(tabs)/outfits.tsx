import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui';
import { listGarments, listOutfits } from '@/lib/data';
import { font, shadow, T } from '@/lib/theme';
import { styleLabel, type Garment, type Outfit } from '@/lib/types';

export default function Outfits() {
  const [outfits, setOutfits] = useState<Outfit[] | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listOutfits(), listGarments()])
        .then(([o, g]) => {
          setOutfits(o);
          setGarments(g);
        })
        .catch(() => setOutfits([]));
    }, []),
  );

  const byId = useMemo(() => new Map(garments.map((g) => [g.id, g])), [garments]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={s.header}>
        <Text style={font.title}>Outfits</Text>
        <Text style={font.small}>{outfits ? `${outfits.length} guardados` : ''}</Text>
      </View>

      {outfits === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T.ink} />
        </View>
      ) : outfits.length === 0 ? (
        <EmptyState
          emoji="✨"
          title="Sin outfits todavía"
          hint="Toca ✨ y la IA combinará tu ropa por colores y estilo."
        />
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const pics = item.garment_ids
              .map((id) => byId.get(id))
              .filter(Boolean) as Garment[];
            return (
              <Pressable
                onPress={() => router.push(`/outfit/${item.id}`)}
                style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {pics.slice(0, 4).map((g) => (
                    <View key={g.id} style={s.thumb}>
                      <Image
                        source={{ uri: g.cutout_url ?? g.image_url ?? undefined }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                </View>
                <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[font.h2, { fontSize: 17 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={font.small}>{styleLabel(item.style)}</Text>
                  </View>
                  {item.score != null ? (
                    <View style={s.score}>
                      <Text style={{ color: T.gold, fontWeight: '800', fontSize: 15 }}>
                        {item.score}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable style={s.fab} onPress={() => router.push('/generate-outfit')}>
        <Text style={{ fontSize: 24 }}>✨</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  card: { backgroundColor: T.surface, borderRadius: T.radius, padding: 16, ...shadow },
  thumb: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: T.surfaceSoft,
    borderRadius: 14,
    padding: 6,
  },
  score: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: T.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 26,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.25,
  },
});
