import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { fetchProfile } from '../lib/supabase/auth';
import { useAuthStore } from '../stores/auth.store';

/** Timeout global sur l'init auth (ms) */
const AUTH_INIT_TIMEOUT = 8000;
/** Timeout sur le chargement du profil (ms) */
const FETCH_PROFILE_TIMEOUT = 5000;

/**
 * Initialise et maintient la session Supabase.
 * À monter une seule fois au root de l'app.
 */
export function useAuthInit() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    let isCancelled = false;
    let profileTimer: ReturnType<typeof setTimeout> | null = null;

    const globalTimer = setTimeout(() => {
      isCancelled = true;
      console.warn('[Keurzen] Auth init timeout after ' + AUTH_INIT_TIMEOUT + 'ms — forcing initialized');
      setLoading(false);
      setInitialized(true);
    }, AUTH_INIT_TIMEOUT);

    const fetchProfileWithTimeout = async (userId: string) => {
      return new Promise<Awaited<ReturnType<typeof fetchProfile>>>((resolve, reject) => {
        let settled = false;
        profileTimer = setTimeout(() => {
          if (!settled) {
            settled = true;
            console.warn('[Keurzen] fetchProfile timeout after ' + FETCH_PROFILE_TIMEOUT + 'ms');
            resolve(null);
          }
        }, FETCH_PROFILE_TIMEOUT);
        fetchProfile(userId).then((result) => {
          if (!settled) {
            settled = true;
            if (profileTimer) clearTimeout(profileTimer);
            resolve(result);
          }
        }).catch((err) => {
          if (!settled) {
            settled = true;
            if (profileTimer) clearTimeout(profileTimer);
            reject(err);
          }
        });
      });
    };

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isCancelled) return;
        setSession(session);

        if (session?.user) {
          try {
            const profile = await fetchProfileWithTimeout(session.user.id);
            if (!isCancelled) setProfile(profile);
          } catch (e) {
            console.warn('[Keurzen] fetchProfile error:', e);
          }
        }
      } catch (e) {
        console.warn('[Keurzen] getSession error:', e);
      } finally {
        if (!isCancelled) {
          clearTimeout(globalTimer);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isCancelled) return;
        setSession(session);

        if (session?.user) {
          try {
            const profile = await fetchProfileWithTimeout(session.user.id);
            if (!isCancelled) setProfile(profile);
          } catch (e) {
            console.warn('[Keurzen] fetchProfile error:', e);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isCancelled = true;
      clearTimeout(globalTimer);
      if (profileTimer) clearTimeout(profileTimer);
      subscription.unsubscribe();
    };
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
