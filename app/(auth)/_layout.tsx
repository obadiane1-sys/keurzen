import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors } from '../../src/constants/tokens';

export default function AuthLayout() {
  const { session, isInitialized } = useAuthStore();
  const { pendingInviteToken, pendingInviteCode } = useUiStore();
  const pathname = usePathname();
  const isJoinPage = pathname.includes('/join/') || pathname.includes('/join-code');

  // Ordre strict de redirection :
  // 1. Pas de session → rester sur auth
  // 2. Session + invitation en attente (Magic Link) → rejoindre le foyer
  // 3. Session + code d'invitation en attente → redemption du code
  // 4. Session normale → dashboard (sauf si déjà sur une page join)

  if (isInitialized && session && !isJoinPage) {
    if (pendingInviteToken) {
      // Redirect to root-level /join/[token] — must NOT use group prefix
      // as this route lives outside (auth)
      return <Redirect href={`/join/${pendingInviteToken}` as `/${string}`} />;
    }
    if (pendingInviteCode) {
      return <Redirect href={`/(auth)/join-code?code=${pendingInviteCode}`} />;
    }
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
