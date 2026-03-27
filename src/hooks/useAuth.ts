import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { fetchProfile } from '../lib/supabase/auth';
import { useAuthStore } from '../stores/auth.store';

/**
 * Initialise et maintient la session Supabase.
 * À monter une seule fois au root de l'app.
 */
export function useAuthInit() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setProfile(profile);
      }
      setLoading(false);
      setInitialized(true);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}

/**
 * Hook de commodité pour les données auth courantes
 */
export function useCurrentUser() {
  const { user, profile, isLoading } = useAuthStore();
  return { user, profile, isLoading };
}

/**
 * Hook pour savoir si l'utilisateur est authentifié
 */
export function useIsAuthenticated() {
  const { session, isInitialized } = useAuthStore();
  return { isAuthenticated: !!session, isInitialized };
}
