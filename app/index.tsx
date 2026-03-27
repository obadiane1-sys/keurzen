import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { useUiStore } from '../src/stores/ui.store';
import { Loader } from '../src/components/ui/Loader';

/**
 * Route index — redirige selon l'état d'authentification.
 * Si un token d'invitation est en attente (deep link reçu avant auth),
 * redirige vers /join/[token] après login.
 */
export default function Index() {
  const { session, profile, isInitialized } = useAuthStore();
  const { pendingInviteToken } = useUiStore();

  if (!isInitialized) {
    return <Loader fullScreen label="Chargement..." />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Traiter un token d'invitation en attente avant toute autre redirection
  if (pendingInviteToken) {
    return <Redirect href={`/join/${pendingInviteToken}`} />;
  }

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(app)/dashboard" />;
}
