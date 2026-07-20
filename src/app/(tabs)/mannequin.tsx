import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mannequin } from '@/components/mannequin';
import { PhotoModel } from '@/components/photo-model';
import { Button, Chip } from '@/components/ui';
import { generateTryOn, HAS_TRYON, TRYON_HINT } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { getOutfit, listGarments, saveTryonImage } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { CATEGORIES, MODEL_ANGLES, type Category, type Garment, type ModelAngle } from '@/lib/types';

const TRYON_MSGS = [
  'Leyendo tu foto…',
  'Vistiéndote con las prendas…',
  'Cuidando que tu cara quede idéntica…',
  'Generando la imagen final…',
  'Casi listo, puliendo detalles…',
];

export default function MannequinScreen() {
  const { session, profile } = useAuth();
  const { wear, outfit } = useLocalSearchParams<{ wear?: string; outfit?: string }>();
  const [garments, setGarments] = useState<Garment[]>([]);
  // Una prenda seleccionada por categoría.
  const [selected, setSelected] = useState<Partial<Record<Category, string>>>({});
  const [mode, setMode] = useState<'mannequin' | 'photo'>('mannequin');
  const [angle, setAngle] = useState<ModelAngle>('front');

  const modelUrls = useMemo(
    () => ({
      front: profile?.model_front_url ?? null,
      side: profile?.model_side_url ?? null,
      back: profile?.model_back_url ?? null,
    }),
    [profile],
  );
  const hasModel = !!(modelUrls.front || modelUrls.side || modelUrls.back);

  // ---- Try-on generativo ----
  const [tryonBusy, setTryonBusy] = useState(false);
  const [tryonMsg, setTryonMsg] = useState(0);
  const [tryonResult, setTryonResult] = useState<string | null>(null);
  const [tryonError, setTryonError] = useState('');
  const [tryonSaving, setTryonSaving] = useState(false);
  const [tryonSaved, setTryonSaved] = useState(false);

  useEffect(() => {
    if (!tryonBusy) return;
    setTryonMsg(0);
    const t = setInterval(() => setTryonMsg((i) => (i + 1) % TRYON_MSGS.length), 4500);
    return () => clearInterval(t);
  }, [tryonBusy]);

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

  const runTryon = async () => {
    if (!modelUrls.front) {
      setTryonError('Sube al menos tu foto de frente en "Mi modelo".');
      return;
    }
    if (worn.length === 0) {
      setTryonError('Selecciona al menos una prenda abajo.');
      return;
    }
    setTryonError('');
    setTryonResult(null);
    setTryonSaved(false);
    setTryonBusy(true);
    try {
      const img = await generateTryOn(modelUrls.front, worn, profile);
      setTryonResult(img);
    } catch (e: any) {
      setTryonError(e?.message ?? String(e));
    } finally {
      setTryonBusy(false);
    }
  };

  const saveTryon = async () => {
    if (!session || !tryonResult || tryonSaving) return;
    setTryonSaving(true);
    try {
      await saveTryonImage(session.user.id, tryonResult);
      setTryonSaved(true);
    } catch (e: any) {
      setTryonError(e?.message ?? 'No se pudo guardar');
    } finally {
      setTryonSaving(false);
    }
  };

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: garments.filter((g) => g.category === c.key),
  })).filter((c) => c.items.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.header}>
          <Text style={font.title}>Probador</Text>
          {profile ? (
            <Text style={font.small}>
              {profile.height_cm ?? '—'} cm · {profile.weight_kg ?? '—'} kg
              {profile.shirt_size ? ` · ${profile.shirt_size}` : ''}
              {profile.pants_size ? ` / ${profile.pants_size}` : ''}
              {profile.shoe_size ? ` / ${profile.shoe_size}` : ''}
            </Text>
          ) : null}
        </View>

        {/* Toggle maniquí / mi modelo real */}
        <View style={s.modeRow}>
          <Chip
            label="🧍 Maniquí"
            active={mode === 'mannequin'}
            onPress={() => setMode('mannequin')}
          />
          <Chip
            label="📸 Mi modelo"
            active={mode === 'photo'}
            onPress={() => (hasModel ? setMode('photo') : router.push('/model'))}
          />
        </View>

        {mode === 'photo' ? (
          <View style={{ alignItems: 'center', marginTop: 4, gap: 12 }}>
            <View style={s.photoStage}>
              {modelUrls[angle] ? (
                <PhotoModel personUrl={modelUrls[angle]!} garments={worn} width={230} />
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: 40 }}>
                  No tienes foto de {MODEL_ANGLES.find((a) => a.key === angle)?.label.toLowerCase()}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MODEL_ANGLES.map((a) => (
                <Chip
                  key={a.key}
                  label={a.label}
                  active={angle === a.key}
                  onPress={() => setAngle(a.key)}
                />
              ))}
            </View>
            <Pressable onPress={() => router.push('/model')}>
              <Text style={[font.small, { textDecorationLine: 'underline' }]}>
                Editar mis fotos
              </Text>
            </Pressable>

            {/* Try-on generativo: foto tuya + prendas seleccionadas → imagen IA */}
            <View style={{ width: '100%', paddingHorizontal: 20, gap: 10, marginTop: 4 }}>
              <Button
                title={tryonBusy ? 'Generando…' : '✨ Generar foto IA con este outfit'}
                onPress={runTryon}
                loading={tryonBusy}
              />
              {tryonBusy ? (
                <Text style={[font.small, { textAlign: 'center' }]}>
                  {TRYON_MSGS[tryonMsg]} Puede tardar hasta un minuto.
                </Text>
              ) : null}
              {!HAS_TRYON && !tryonBusy ? (
                <Text style={[font.small, { textAlign: 'center' }]}>{TRYON_HINT}</Text>
              ) : null}
              {tryonError ? (
                <Text style={{ color: T.danger, fontSize: 13, textAlign: 'center' }}>
                  {tryonError}
                </Text>
              ) : null}
              {tryonResult ? (
                <View style={s.tryonCard}>
                  <Image
                    source={{ uri: tryonResult }}
                    style={s.tryonImg}
                    contentFit="cover"
                    transition={300}
                  />
                  <View style={{ flexDirection: 'row', gap: 10, padding: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        small
                        title={tryonSaved ? '✓ Guardada' : 'Guardar'}
                        onPress={saveTryon}
                        loading={tryonSaving}
                        disabled={tryonSaved}
                        variant={tryonSaved ? 'ghost' : 'primary'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        small
                        title="Cerrar"
                        variant="ghost"
                        onPress={() => setTryonResult(null)}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Mannequin variant="black" profile={profile} garments={worn} width={230} />
            {worn.length === 0 ? (
              <Text style={[font.small, { marginTop: -40 }]}>
                Toca una prenda abajo para vestir el maniquí
              </Text>
            ) : null}
          </View>
        )}

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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  photoStage: {
    backgroundColor: '#0E0D0A',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryonCard: {
    backgroundColor: T.surface,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tryonImg: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: T.surfaceSoft,
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
