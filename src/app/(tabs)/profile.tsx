import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Row } from '@/components/ui';
import { AI_URL, aiHealth } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { font, T } from '@/lib/theme';

export default function Profile() {
  const { session, profile } = useAuth();
  const [ai, setAi] = useState<{ ok: boolean; ollama: boolean; model: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      aiHealth().then(setAi);
    }, []),
  );

  const modelCount = [
    profile?.model_front_url,
    profile?.model_side_url,
    profile?.model_back_url,
  ].filter(Boolean).length;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={[font.title, { marginTop: 14 }]}>Perfil</Text>
        <Text style={[font.body, { marginTop: 2 }]}>{session?.user.email}</Text>

        <Card style={{ marginTop: 22 }}>
          <Text style={[font.label, { marginBottom: 4 }]}>Tus medidas</Text>
          <Row label="Nombre" value={profile?.display_name ?? '—'} />
          <Row label="Género" value={profile?.gender ?? '—'} />
          <Row label="Altura" value={profile?.height_cm ? `${profile.height_cm} cm` : '—'} />
          <Row label="Peso" value={profile?.weight_kg ? `${profile.weight_kg} kg` : '—'} />
          <Row label="Pecho" value={profile?.chest_cm ? `${profile.chest_cm} cm` : '—'} />
          <Row label="Cintura" value={profile?.waist_cm ? `${profile.waist_cm} cm` : '—'} />
          <Row label="Cadera" value={profile?.hips_cm ? `${profile.hips_cm} cm` : '—'} />
          <Row label="Talla camisa" value={profile?.shirt_size ?? '—'} />
          <Row label="Talla pantalón" value={profile?.pants_size ?? '—'} />
          <Row label="Calzado" value={profile?.shoe_size ?? '—'} />
          <View style={{ marginTop: 14 }}>
            <Button title="Editar medidas" onPress={() => router.push('/onboarding')} variant="ghost" small />
          </View>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[font.label, { marginBottom: 4 }]}>Mi modelo</Text>
          <Text style={[font.body, { marginBottom: 12 }]}>
            {modelCount > 0
              ? `${modelCount} de 3 ángulos listos. Úsalo en el Probador para verte con la ropa.`
              : 'Sube fotos tuyas de varios ángulos para probarte la ropa sobre tu propia foto.'}
          </Text>
          <Button
            title={modelCount > 0 ? 'Editar mi modelo' : 'Crear mi modelo'}
            onPress={() => router.push('/model')}
            variant="ghost"
            small
          />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[font.label, { marginBottom: 4 }]}>IA local</Text>
          <View style={s.aiRow}>
            <View
              style={[s.dot, { backgroundColor: ai?.ok && ai?.ollama ? T.ok : T.danger }]}
            />
            <Text style={font.body}>
              {ai === null
                ? 'Comprobando…'
                : ai.ok && ai.ollama
                  ? `Conectada (${ai.model})`
                  : ai.ok
                    ? 'Servidor activo, pero Ollama no responde'
                    : 'Sin conexión — ejecuta start-ai.bat en tu PC'}
            </Text>
          </View>
          <Text style={[font.small, { marginTop: 8 }]}>{AI_URL}</Text>
        </Card>

        <View style={{ marginTop: 24 }}>
          <Button title="Cerrar sesión" onPress={signOut} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
