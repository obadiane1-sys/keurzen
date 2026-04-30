import { useRef, useState, useEffect, useCallback } from 'react';
import { TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
import { useHouseholdStore } from '../stores/household.store';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase/client';
import { fetchProfile } from '../lib/supabase/auth';

const CODE_LENGTH = 6;

interface HouseholdPayload {
  id?: string;
  name?: string;
}

interface RedeemPayload {
  success?: boolean;
  access_token?: string;
  refresh_token?: string;
  household?: HouseholdPayload;
  already_member?: boolean;
  error?: string;
}

export function useJoinCode() {
  const router = useRouter();
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const { session } = useAuthStore();
  const { showToast, setPendingInviteCode } = useUiStore();

  const [isJoining, setIsJoining] = useState(false);
  const [alreadyMemberHousehold, setAlreadyMemberHousehold] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Read code from URL params (email CTA link) and pre-fill
  useEffect(() => {
    const urlCode =
      codeParam ??
      (Platform.OS === 'web' && typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('code') ?? undefined)
        : undefined);

    if (urlCode) {
      const cleaned = urlCode.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
      if (cleaned.length > 0) {
        const newDigits = Array(CODE_LENGTH).fill('');
        for (let i = 0; i < cleaned.length; i++) {
          newDigits[i] = cleaned[i];
        }
        setDigits(newDigits);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every((d) => d !== '');

  const handleChange = useCallback(
    (text: string, index: number) => {
      const digit = text.replace(/[^0-9]/g, '').slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);
      setError(null);

      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (cleaned.length > 0) {
      const newDigits = Array(CODE_LENGTH).fill('');
      for (let i = 0; i < cleaned.length; i++) {
        newDigits[i] = cleaned[i];
      }
      setDigits(newDigits);
      const focusIndex = Math.min(cleaned.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }, []);

  // Keep a ref to digits so handleSubmit always reads latest
  const digitsRef = useRef(digits);
  digitsRef.current = digits;

  const handleSubmit = useCallback(async () => {
    const currentDigits = digitsRef.current;
    const currentCode = currentDigits.join('');
    const currentIsComplete =
      currentCode.length === CODE_LENGTH && currentDigits.every((d) => d !== '');

    if (!currentIsComplete || isJoining) return;

    setIsJoining(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        'x-app-name': 'keurzen-mobile',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/redeem-invite-code`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: currentCode }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const payload = (await res.json()) as RedeemPayload;

      if (!res.ok || payload.error) {
        throw new Error(payload.error ?? `Erreur serveur (${res.status})`);
      }

      // Establish session if we don't already have one
      if (!session && payload.access_token && payload.refresh_token) {
        let sessionEstablished = false;

        try {
          await Promise.race([
            supabase.auth.setSession({
              access_token: payload.access_token,
              refresh_token: payload.refresh_token,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 8_000),
            ),
          ]);
          sessionEstablished = true;
        } catch {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          if (currentSession) {
            sessionEstablished = true;
          } else {
            try {
              await Promise.race([
                supabase.auth.setSession({
                  access_token: payload.access_token,
                  refresh_token: payload.refresh_token,
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('timeout')), 8_000),
                ),
              ]);
              sessionEstablished = true;
            } catch {
              const {
                data: { session: retrySession },
              } = await supabase.auth.getSession();
              sessionEstablished = !!retrySession;
            }
          }
        }

        if (!sessionEstablished) {
          setError("Impossible d'\u00e9tablir la session. V\u00e9rifiez votre connexion et r\u00e9essayez.");
          setIsJoining(false);
          return;
        }

        // Push session into zustand BEFORE navigating \u2014 onAuthStateChange may
        // not have propagated yet, and (app)/_layout reads session from zustand
        // to gate access. Without this, the layout sees null session and
        // bounces back to /(auth)/login during the cross-group navigation.
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (freshSession) {
          useAuthStore.getState().setSession(freshSession);
          // Hydrate profile too, since useAuthInit's listener may still be
          // racing against router.replace below.
          if (freshSession.user) {
            const profile = await fetchProfile(freshSession.user.id);
            if (profile) useAuthStore.getState().setProfile(profile);
          }
        }
      }

      if (payload.already_member) {
        setAlreadyMemberHousehold(payload.household?.name ?? 'ce foyer');
        setIsJoining(false);
        return;
      }

      // Hydrate household store
      if (payload.household) {
        const { setHousehold, setMembers } = useHouseholdStore.getState();
        setHousehold(payload.household as any);

        const householdIdForHydration = payload.household.id;
        if (householdIdForHydration) {
          const { data: members } = await supabase
            .from('household_members')
            .select('*, profile:profiles(*)')
            .eq('household_id', householdIdForHydration);
          if (members) setMembers(members as any);
        }
      }

      setPendingInviteCode(null);

      // Reset digits so the auto-submit effect doesn't re-fire on remount.
      setDigits(Array(CODE_LENGTH).fill(''));

      // Navigate to post-join onboarding (or dashboard if already completed)
      const householdId = payload.household?.id;
      if (householdId) {
        const { completedJoinOnboardingForHouseholds } = useUiStore.getState();
        if (completedJoinOnboardingForHouseholds.includes(householdId)) {
          router.replace('/(app)/dashboard');
        } else {
          router.replace('/(app)/onboarding/post-join');
        }
      } else {
        router.replace('/(app)/dashboard');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('aborted') || msg.includes('abort')) {
        setError('Le serveur met trop de temps \u00e0 r\u00e9pondre. R\u00e9essayez.');
      } else {
        setError(msg);
      }
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, session, router, setPendingInviteCode, showToast]);

  // Auto-submit when pre-filled from URL
  useEffect(() => {
    if (isComplete && !autoSubmitted && codeParam && !isJoining) {
      setAutoSubmitted(true);
      const timer = setTimeout(() => handleSubmit(), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, autoSubmitted, isJoining]);

  const resetAlreadyMember = useCallback(() => {
    setAlreadyMemberHousehold(null);
    setDigits(Array(CODE_LENGTH).fill(''));
  }, []);

  return {
    digits,
    setDigits,
    error,
    isJoining,
    isComplete,
    alreadyMemberHousehold,
    handleChange,
    handleKeyPress,
    handlePaste,
    handleSubmit,
    resetAlreadyMember,
    inputRefs,
    session,
  };
}
