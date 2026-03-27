/**
 * /auth/callback
 *
 * Point d'entrée après confirmation email Supabase (signup standard ou reset password).
 * NE concerne PAS le flow invitation — celui-ci passe par signup-for-invite (Edge Function)
 * qui crée le compte auto-confirmé sans email.
 *
 * URL reçues :
 *   - Confirmation signup : /auth/callback?token_hash=XXX&type=signup
 *   - Reset password      : /auth/callback?token_hash=XXX&type=recovery
 *
 * On appelle supabase.auth.verifyOtp() directement pour échanger le token_hash.
 * Cela évite la race condition où detectSessionInUrl (async) n'a pas encore
 * terminé quand getSession() est appelé, causant une redirection prématurée
 * vers la page de login/signup.
 *
 * Redirections :
 *   - type=recovery  → /(auth)/reset-password (saisie du nouveau mot de passe)
 *   - session OK     → /(app)/dashboard
 *   - erreur / pas de token → /(auth)/login
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase/client';
import { useUiStore } from '../../src/stores/ui.store';
import { Loader } from '../../src/components/ui/Loader';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { setPendingInviteToken } = useUiStore();

  useEffect(() => {
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;

    const tokenHash = params?.get('token_hash');
    const type = params?.get('type') as 'signup' | 'recovery' | 'magiclink' | null;

    if (!tokenHash || !type) {
      // Aucun token à échanger — vérifier la session courante
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.replace('/(auth)/login');
          return;
        }
        setPendingInviteToken(null);
        router.replace('/(app)/dashboard');
      });
      return;
    }

    // Échange explicite du token_hash → pas de race condition
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
      if (error || !data.session) {
        router.replace('/(auth)/login');
        return;
      }

      if (type === 'recovery') {
        // Flow reset password : la page de saisie du nouveau mot de passe prend le relais
        setPendingInviteToken(null);
        router.replace('/(auth)/reset-password');
        return;
      }

      // Signup / magic link confirmé
      setPendingInviteToken(null);
      router.replace('/(app)/dashboard');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Loader fullScreen label="Finalisation de votre compte…" />;
}
