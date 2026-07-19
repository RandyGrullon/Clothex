import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { T } from '@/lib/theme';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator color={T.ink} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile?.height_cm) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/closet" />;
}
