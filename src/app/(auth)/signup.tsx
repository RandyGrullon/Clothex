import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { font, T } from '@/lib/theme';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setError('');
    setInfo('');
    if (password.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase.auth.signUp({ email: email.trim(), password });
    if (e) {
      setLoading(false);
      setError(e.message);
      return;
    }
    if (!data.session) {
      // Si el proyecto pide confirmación por correo, intenta entrar directo.
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (e2) {
        setInfo('Cuenta creada. Confirma tu correo y luego inicia sesión.');
        return;
      }
    } else {
      setLoading(false);
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6, marginBottom: 40 }}>
            <Text style={s.logo}>Crear cuenta</Text>
            <Text style={font.body}>Empieza a construir tu closet digital.</Text>
          </View>
          <View style={{ gap: 16 }}>
            <Input
              label="Correo"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="mínimo 6 caracteres"
              secureTextEntry
            />
            {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
            {info ? <Text style={{ color: T.ok, fontSize: 13.5 }}>{info}</Text> : null}
            <Button title="Crear cuenta" onPress={signUp} loading={loading} />
            <Link href="/(auth)/login" style={s.link}>
              ¿Ya tienes cuenta? <Text style={{ fontWeight: '700', color: T.ink }}>Entrar</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logo: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: T.ink },
  link: { textAlign: 'center', color: T.muted, fontSize: 14, marginTop: 8 },
});
