import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip } from '@/components/ui';
import { generateOutfits } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { listGarments, saveOutfit } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { STYLES, type Garment, type OutfitSuggestion } from '@/lib/types';

export default function GenerateOutfit() {
  const { session, profile } = useAuth();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [style, setStyle] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[] | null>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    listGarments().then(setGarments).catch(() => {});
  }, []);

  const byId = useMemo(() => new Map(garments.map((g) => [g.id, g])), [garments]);

  const generate = async () => {
    setError('');
    setSuggestions(null);
    setSavedIdx(new Set());
    if (garments.length < 2) {
      setError('Necesitas al menos 2 prendas en el closet para combinar.');
      return;
    }
    setLoading(true);
    try {
      const out = await generateOutfits(garments, style, profile);
      const valid = out.filter((s) => s.garment_ids?.some((id) => byId.has(id)));
      setSuggestions(valid);
      if (!valid.length) setError('La IA no encontró combinaciones. Prueba otro estilo o añade más prendas.');
    } catch (e: any) {
      setError(`La IA no respondió (${e.message ?? e}). ¿Está corriendo ai-server?`);
    } finally {
      setLoading(false);
    }
  };

  const save = async (s: OutfitSuggestion, idx: number) => {
    if (!session) return;
    await saveOutfit(session.user.id, { ...s, style });
    setSavedIdx((prev) => new Set(prev).add(idx));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text style={font.title}>Generar outfit</Text>
        <Text style={[font.body, { marginTop: 6 }]}>
          La IA mira colores, telas y tipo de cada prenda para armar combinaciones que funcionen.
        </Text>

        <Text style={[font.label, { marginTop: 24, marginBottom: 8 }]}>Estilo</Text>
        <View style={s.wrap}>
          {STYLES.map((st) => (
            <Chip key={st.key} label={st.label} active={style === st.key} onPress={() => setStyle(st.key)} />
          ))}
        </View>

        <View style={{ marginTop: 20, gap: 10 }}>
          <Button
            title={loading ? 'Combinando…' : '✨  Combinar con IA'}
            onPress={generate}
            loading={loading}
          />
          {loading ? (
            <Text style={[font.small, { textAlign: 'center' }]}>
              Analizando {garments.length} prendas… esto puede tardar un poco.
            </Text>
          ) : null}
          {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
        </View>

        {suggestions?.map((sug, idx) => {
          const pics = sug.garment_ids.map((id) => byId.get(id)).filter(Boolean) as Garment[];
          const saved = savedIdx.has(idx);
          return (
            <Card key={idx} style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {pics.map((g) => (
                  <View key={g.id} style={s.thumb}>
                    <Image
                      source={{ uri: g.cutout_url ?? g.image_url ?? undefined }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Text style={[font.h2, { fontSize: 17, flex: 1 }]}>{sug.name}</Text>
                <Text style={{ color: T.gold, fontWeight: '800' }}>{sug.score}/10</Text>
              </View>
              <Text style={[font.body, { marginTop: 6 }]}>{sug.reason}</Text>
              <View style={{ marginTop: 14 }}>
                <Button
                  title={saved ? '✓ Guardado' : 'Guardar outfit'}
                  onPress={() => save(sug, idx)}
                  variant={saved ? 'ghost' : 'primary'}
                  small
                  disabled={saved}
                />
              </View>
            </Card>
          );
        })}

        <View style={{ marginTop: 24 }}>
          <Button title="Cerrar" onPress={() => router.back()} variant="ghost" />
        </View>
      </ScrollView>
      {loading ? (
        <View style={s.loadingBar}>
          <ActivityIndicator color={T.ink} size="small" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { flex: 1, aspectRatio: 1, backgroundColor: T.surfaceSoft, borderRadius: 14, padding: 6 },
  loadingBar: { position: 'absolute', top: 18, right: 18 },
});
