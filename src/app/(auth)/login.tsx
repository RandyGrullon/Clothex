import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { font, T } from '@/lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError('');
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (e) {
      setError(e.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : e.message);
      return;
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
            <Text style={s.logo}>Klozet</Text>
            <Text style={font.body}>Tu closet, entendido por IA.</Text>
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
              placeholder="••••••••"
              secureTextEntry
            />
            {error ? <Text style={{ color: T.danger, fontSize: 13.5 }}>{error}</Text> : null}
            <Button title="Entrar" onPress={signIn} loading={loading} />
            <Link href="/(auth)/signup" style={s.link}>
              ¿No tienes cuenta? <Text style={{ fontWeight: '700', color: T.ink }}>Crear una</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logo: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, color: T.ink },
  link: { textAlign: 'center', color: T.muted, fontSize: 14, marginTop: 8 },
});
