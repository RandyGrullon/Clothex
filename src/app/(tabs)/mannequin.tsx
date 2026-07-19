import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mannequin } from '@/components/mannequin';
import { useAuth } from '@/lib/auth';
import { getOutfit, listGarments } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { CATEGORIES, type Category, type Garment } from '@/lib/types';

export default function MannequinScreen() {
  const { profile } = useAuth();
  const { wear, outfit } = useLocalSearchParams<{ wear?: string; outfit?: string }>();
  const [garments, setGarments] = useState<Garment[]>([]);
  // Una prenda seleccionada por categoría.
  const [selected, setSelected] = useState<Partial<Record<Category, string>>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const list = await listGarments().catch(() => [] as Garment[]);
        if (!active) return;
        setGarments(list);
        if (outfit) {
          const o = await getOutfit(outfit).catch(() => null);
          if (!active || !o) return;
          const next: Partial<Record<Category, string>> = {};
          for (const gid of o.garment_ids) {
            const g = list.find((x) => x.id === gid);
            if (g) next[g.category] = g.id;
          }
          setSelected(next);
        } else if (wear) {
          const g = list.find((x) => x.id === wear);
          if (g) setSelected((prev) => ({ ...prev, [g.category]: g.id }));
        }
      })();
      return () => {
        active = false;
      };
    }, [wear, outfit]),
  );

  const worn = useMemo(
    () =>
      Object.values(selected)
        .map((id) => garments.find((g) => g.id === id))
        .filter(Boolean) as Garment[],
    [selected, garments],
  );

  const toggle = (g: Garment) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[g.category] === g.id) delete next[g.category];
      else next[g.category] = g.id;
      return next;
    });

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: garments.filter((g) => g.category === c.key),
  })).filter((c) => c.items.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.header}>
          <Text style={font.title}>Maniquí</Text>
          {profile ? (
            <Text style={font.small}>
              {profile.height_cm ?? '—'} cm · {profile.weight_kg ?? '—'} kg
              {profile.shirt_size ? ` · ${profile.shirt_size}` : ''}
              {profile.pants_size ? ` / ${profile.pants_size}` : ''}
              {profile.shoe_size ? ` / ${profile.shoe_size}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Mannequin profile={profile} garments={worn} width={230} />
          {worn.length === 0 ? (
            <Text style={[font.small, { marginTop: -40 }]}>
              Toca una prenda abajo para vestir el maniquí
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: 16, gap: 18 }}>
          {grouped.length === 0 ? (
            <Text style={[font.body, { textAlign: 'center', paddingHorizontal: 40 }]}>
              Añade prendas a tu closet para poder vestir el maniquí.
            </Text>
          ) : null}
          {grouped.map((cat) => (
            <View key={cat.key}>
              <Text style={[font.label, { paddingHorizontal: 20, marginBottom: 8 }]}>
                {cat.emoji} {cat.label}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              >
                {cat.items.map((g) => {
                  const active = selected[g.category] === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => toggle(g)}
                      style={[s.pick, active && { borderColor: T.ink, borderWidth: 2 }]}
                    >
                      <Image
                        source={{ uri: g.cutout_url ?? g.image_url ?? undefined }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 2,
  },
  pick: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: T.surfaceSoft,
    borderWidth: 1.5,
    borderColor: T.line,
    padding: 6,
  },
});
