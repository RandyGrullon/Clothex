import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentCard } from '@/components/garment-card';
import { Chip, EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { listGarments } from '@/lib/data';
import { font, shadow, T } from '@/lib/theme';
import { CATEGORIES, type Garment } from '@/lib/types';

export default function Closet() {
  const { profile } = useAuth();
  const [garments, setGarments] = useState<Garment[] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listGarments().then(setGarments).catch(() => setGarments([]));
    }, []),
  );

  const filtered = useMemo(
    () => (filter ? (garments ?? []).filter((g) => g.category === filter) : garments ?? []),
    [garments, filter],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={font.small}>
            {profile?.display_name ? `Hola, ${profile.display_name}` : 'Hola'}
          </Text>
          <Text style={font.title}>Tu Closet</Text>
        </View>
        <Text style={font.small}>{garments ? `${garments.length} prendas` : ''}</Text>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 14 }}
        >
          <Chip label="Todo" active={filter === null} onPress={() => setFilter(null)} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={`${c.emoji} ${c.label}`}
              active={filter === c.key}
              onPress={() => setFilter(filter === c.key ? null : c.key)}
            />
          ))}
        </ScrollView>
      </View>

      {garments === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T.ink} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title={filter ? 'Nada en esta categoría' : 'Closet vacío'}
          hint="Toca + para subir una foto de tu ropa. La IA hace el resto."
        />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(g) => g.id}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <GarmentCard garment={item} onPress={() => router.push(`/garment/${item.id}`)} />
          )}
        />
      )}

      <Pressable style={s.fab} onPress={() => router.push('/add-garment')}>
        <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
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
