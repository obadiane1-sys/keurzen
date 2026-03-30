import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase/client';
import { useUiStore } from '../../src/stores/ui.store';
import { Loader } from '../../src/components/ui/Loader';

/**
 * Auth callback — handles Supabase email confirmation and password reset redirects.
 *
 * Supabase redirige ici apres confirmation email ou reset password.
 * On extrait le token_hash et le type pour finaliser la verification.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const { pendingInviteToken } = useUiStore();
  const { showToast } = useUiStore();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;

    async function handleCallback() {
      // Sur web, les params peuvent etre dans window.location.search.
      // useLocalSearchParams peut ne pas les exposer pour les routes sans
      // segments dynamiques, donc on lit toujours window.location.search en
      // priorite sur web.
      let tokenHash = params.token_hash;
      let type = params.type;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const hashFromUrl = urlParams.get('token_hash') ?? undefined;
        const typeFromUrl = urlParams.get('type') ?? undefined;
        if (hashFromUrl) tokenHash = hashFromUrl;
        if (typeFromUrl) type = typeFromUrl;
      }

      if (tokenHash && type) {
        // Pour la confirmation email après signup, Supabase envoie type=signup
        // dans l'URL. verifyOtp accepte 'signup' mais certaines versions de
        // supabase-js nécessitent 'email'. On essaie 'signup' d'abord, puis
        // 'email' en fallback.
        let verifyError: Error | null = null;

        if (type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          verifyError = error;
        } else {
          // Essai 1 : type exact de l'URL (signup ou autre)
          const primaryType = type === 'signup' ? 'signup' : 'email';
          const { error: err1 } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: primaryType as 'signup' | 'email',
          });

          if (err1) {
            // Essai 2 : fallback sur l'autre type email
            const fallbackType = primaryType === 'signup' ? 'email' : 'signup';
            const { error: err2 } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: fallbackType as 'signup' | 'email',
            });
            verifyError = err2;
          }
        }

        if (verifyError) {
          const detail = verifyError.message ?? 'Token invalide ou expiré';
          showToast(`Echec de verification : ${detail}`, 'error');
          router.replace('/(auth)/login');
          return;
        }
      }

      setProcessed(true);

      // Recovery ou confirmation → redirect based on pending invite
      if (pendingInviteToken) {
        router.replace(`/join/${pendingInviteToken}`);
      } else {
        router.replace('/(app)/dashboard');
      }
    }

    handleCallback().catch((err: unknown) => {
      setProcessed(true);
      const detail = err instanceof Error ? err.message : 'Erreur inconnue';
      showToast(`Erreur de verification : ${detail}`, 'error');
      router.replace('/(auth)/login');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token_hash, params.type]);

  return <Loader fullScreen label="Verification en cours..." />;
}
