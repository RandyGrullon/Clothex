import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { T } from '@/lib/theme';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (!loading && session) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }} />
  );
}
