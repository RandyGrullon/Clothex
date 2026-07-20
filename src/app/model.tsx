import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { AI_ERROR_HINT, cutoutPerson } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { saveModelPhoto } from '@/lib/data';
import { font, shadow, T } from '@/lib/theme';
import { MODEL_ANGLES, type ModelAngle } from '@/lib/types';

export default function ModelScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState<ModelAngle | null>(null);
  const [error, setError] = useState('');
  const [angleView, setAngleView] = useState<ModelAngle>('front');

  const urls = useMemo(
    () => ({
      front: profile?.model_front_url ?? null,
      side: profile?.model_side_url ?? null,
      back: profile?.model_back_url ?? null,
    }),
    [profile],
  );

  const pick = async (angle: ModelAngle) => {
    if (!session) return;
    setError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Necesito permiso para acceder a tus fotos. Actívalo en los ajustes.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      base64: true,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets[0]?.base64) return;

    setBusy(angle);
    try {
      const cut = await cutoutPerson(res.assets[0].base64);
      await saveModelPhoto(session.user.id, angle, cut);
      await refreshProfile();
      setAngleView(angle);
    } catch (e: any) {
      setError(`No se pudo procesar la foto (${e.message ?? e}). ${AI_ERROR_HINT}`);
    } finally {
      setBusy(null);
    }
  };

  const hasAny = urls.front || urls.side || urls.back;
  const viewUrl = urls[angleView];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Button title="←" onPress={() => router.back()} variant="ghost" small />
        <Text style={[font.title, { marginTop: 14 }]}>Mi modelo</Text>
        <Text style={[font.body, { marginTop: 6 }]}>
          Sube fotos tuyas de cuerpo completo desde varios ángulos. La IA les quita el fondo y
          arma tu modelo para el probador — <Text style={{ fontWeight: '700' }}>tu cara nunca se
          modifica</Text>, es tu foto real.
        </Text>

        {/* Turntable de la persona */}
        {hasAny ? (
          <View style={s.stage}>
            {viewUrl ? (
              <Image source={{ uri: viewUrl }} style={s.person} contentFit="contain" transition={200} />
            ) : (
              <View style={[s.person, s.personEmpty]}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  Falta la foto de {MODEL_ANGLES.find((a) => a.key === angleView)?.label.toLowerCase()}
                </Text>
              </View>
            )}
            <View style={s.angleRow}>
              {MODEL_ANGLES.map((a) => (
                <Pressable
                  key={a.key}
                  onPress={() => setAngleView(a.key)}
                  style={[s.angleBtn, angleView === a.key && s.angleBtnActive]}
                >
                  <Text
                    style={{
                      color: angleView === a.key ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontSize: 12.5,
                      fontWeight: '600',
                    }}
                  >
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Slots de carga */}
        <View style={{ gap: 12, marginTop: 22 }}>
          {MODEL_ANGLES.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => (busy ? null : pick(a.key))}
              style={s.slot}
              disabled={!!busy}
            >
              <View style={s.slotThumb}>
                {busy === a.key ? (
                  <ActivityIndicator color={T.ink} />
                ) : urls[a.key] ? (
                  <Image
                    source={{ uri: urls[a.key]! }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={{ fontSize: 26 }}>＋</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[font.body, { color: T.ink, fontWeight: '700' }]}>{a.label}</Text>
                <Text style={font.small}>
                  {busy === a.key
                    ? 'Procesando con IA…'
                    : urls[a.key]
                      ? 'Toca para reemplazar'
                      : a.hint}
                </Text>
              </View>
              {urls[a.key] && busy !== a.key ? (
                <Text style={{ color: T.ok, fontSize: 18 }}>✓</Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {error ? <Text style={{ color: T.danger, fontSize: 13.5, marginTop: 16 }}>{error}</Text> : null}

        <View style={{ marginTop: 24 }}>
          <Button title="Listo" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  stage: {
    marginTop: 20,
    backgroundColor: '#0E0D0A',
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 14,
  },
  person: { width: 200, height: 340 },
  personEmpty: { alignItems: 'center', justifyContent: 'center' },
  angleRow: { flexDirection: 'row', gap: 8 },
  angleBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  angleBtnActive: { backgroundColor: T.gold, borderColor: T.gold },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: 12,
    ...shadow,
  },
  slotThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: T.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
