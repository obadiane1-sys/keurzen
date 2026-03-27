import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { Colors } from '../../src/constants/tokens';

export default function OnboardingLayout() {
  const { session, profile } = useAuthStore();

  // Not authenticated → go to login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Already seen onboarding → go to app
  if (profile?.has_seen_onboarding) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'none',
      }}
    />
  );
}
