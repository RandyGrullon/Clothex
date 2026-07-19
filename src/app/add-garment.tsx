import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Input } from '@/components/ui';
import { processGarment } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { addGarment } from '@/lib/data';
import { font, T } from '@/lib/theme';
import { CATEGORIES, STYLES, type Category, type GarmentAnalysis } from '@/lib/types';

type Step = 'pick' | 'processing' | 'review';

const PROCESS_MSGS = [
  'Quitando el fondo…',
  'Detectando tipo de prenda…',
  'Analizando tela y material…',
  'Leyendo colores y patrón…',
  'Clasificando el estilo…',
];

export default function AddGarment() {
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('pick');
  const [originalB64, setOriginalB64] = useState<string | null>(null);
  const [cutoutB64, setCutoutB64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GarmentAnalysis | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (step !== 'processing') return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % PROCESS_MSGS.length), 3500);
    return () => clearInterval(t);
  }, [step]);

  const pick = async (fromCamera: boolean) => {
    setError('');
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.85,
      base64: true,
      allowsEditing: false,
    };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]?.base64) return;
    const b64 = res.assets[0].base64;
    setOriginalB64(b64);
    setStep('processing');
    try {
      const out = await processGarment(b64);
      setCutoutB64(out.cutout_b64);
      setAnalysis(out.analysis);
      setStep('review');
    } catch (e: any) {
      setError(
        `La IA no respondió (${e.message ?? e}). ¿Está corriendo ai-server? Ejecuta start-ai.bat`,
      );
      setStep('pick');
    }
  };

  const save = async () => {
    if (!session || !originalB64 || !cutoutB64 || !analysis) return;
    if (!analysis.name.trim()) {
      setError('Ponle un nombre a la prenda');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addGarment(session.user.id, originalB64, cutoutB64, analysis);
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'No se pudo guardar');
      setSaving(false);
    }
  };

  const set = (patch: Partial<GarmentAnalysis>) =>
    setAnalysis((a) => (a ? { ...a, ...patch } : a));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={font.title}>Nueva prenda</Text>

        {step === 'pick' && (
          <View style={{ gap: 14, marginTop: 24 }}>
            <Text style={font.body}>
              Sube una foto de la prenda. La IA quitará el fondo, detectará el tipo, la tela, los
              colores y el estilo.
            </Text>
            <Button title="📷  Tomar foto" onPress={() => pick(true)} />
            <Button title="🖼️  Elegir de la galería" onPress={() => pick(false)} variant="ghost" />
            {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
            <Button title="Cancelar" onPress={() => router.back()} variant="ghost" />
          </View>
        )}

        {step === 'processing' && (
          <View style={{ alignItems: 'center', gap: 20, marginTop: 30 }}>
            {originalB64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${originalB64}` }}
                style={s.preview}
                resizeMode="cover"
              />
            ) : null}
            <ActivityIndicator color={T.ink} size="large" />
            <Text style={[font.h2, { textAlign: 'center' }]}>{PROCESS_MSGS[msgIdx]}</Text>
            <Text style={[font.small, { textAlign: 'center' }]}>
              La IA local está trabajando. Puede tardar un poco la primera vez.
            </Text>
          </View>
        )}

        {step === 'review' && analysis && (
          <View style={{ gap: 18, marginTop: 18 }}>
            <View style={s.cutoutBox}>
              <Image
                source={{ uri: `data:image/png;base64,${cutoutB64}` }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            <Input label="Nombre" value={analysis.name} onChangeText={(v) => set({ name: v })} />

            <View style={{ gap: 6 }}>
              <Text style={font.label}>Categoría</Text>
              <View style={s.wrap}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    active={analysis.category === c.key}
                    onPress={() => set({ category: c.key as Category })}
                  />
                ))}
              </View>
            </View>

            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Input label="Tipo" value={analysis.subtype} onChangeText={(v) => set({ subtype: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Material" value={analysis.material} onChangeText={(v) => set({ material: v })} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Input label="Patrón" value={analysis.pattern} onChangeText={(v) => set({ pattern: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Corte / fit" value={analysis.fit} onChangeText={(v) => set({ fit: v })} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={font.label}>Colores detectados</Text>
              <View style={s.wrap}>
                {analysis.colors.map((c, i) => (
                  <View key={i} style={s.colorPill}>
                    <View style={[s.dot, { backgroundColor: c.hex }]} />
                    <Text style={{ fontSize: 13, color: T.inkSoft }}>{c.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={font.label}>Estilos</Text>
              <View style={s.wrap}>
                {STYLES.map((st) => {
                  const active = analysis.styles.includes(st.key);
                  return (
                    <Chip
                      key={st.key}
                      label={st.label}
                      active={active}
                      onPress={() =>
                        set({
                          styles: active
                            ? analysis.styles.filter((x) => x !== st.key)
                            : [...analysis.styles, st.key],
                        })
                      }
                    />
                  );
                })}
              </View>
            </View>

            <Input
              label="Descripción"
              value={analysis.description}
              onChangeText={(v) => set({ description: v })}
              multiline
            />

            {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
            <Button title="Guardar en el closet" onPress={save} loading={saving} />
            <Button title="Descartar" onPress={() => router.back()} variant="ghost" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  preview: { width: 220, height: 220, borderRadius: 24, backgroundColor: T.surfaceSoft },
  cutoutBox: {
    height: 260,
    borderRadius: 24,
    backgroundColor: T.surfaceSoft,
    padding: 16,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.line,
    borderRadius: 16,
    paddingHorizontal: 11,
    height: 32,
  },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
});
