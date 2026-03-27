import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors } from '../../src/constants/tokens';

export default function AuthLayout() {
  const { session, isInitialized, needsPasswordSetup } = useAuthStore();
  const { pendingInviteToken } = useUiStore();

  // needsPasswordSetup est mis à true par join/[token].tsx avant la navigation
  // vers setup-profile, et remis à false après le changement de mot de passe.
  // Ce flag est la source de vérité déterministe pour bloquer la redirection
  // automatique vers dashboard lors du flux post-invitation.
  if (isInitialized && session && !needsPasswordSetup) {
    // Si une invitation est en attente, rediriger vers la page join.
    // ?auto=1 signale à la page web de rejoindre automatiquement le foyer
    // sans demander un clic supplémentaire à l'utilisateur.
    if (pendingInviteToken) {
      return <Redirect href={`/join/${pendingInviteToken}?auto=1`} />;
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
