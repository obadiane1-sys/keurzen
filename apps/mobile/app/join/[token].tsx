import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { useJoinByToken } from '../../src/lib/queries/household';
import { supabase } from '../../src/lib/supabase/client';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loader } from '../../src/components/ui/Loader';
import { Mascot } from '../../src/components/ui/Mascot';

/**
 * Join screen — Magic Link invitation flow.
 *
 * Sequence :
 * 1. Extraire la session depuis le hash du deep link (access_token + refresh_token)
 * 2. Appeler join_household_by_token RPC
 * 3. Naviguer vers le dashboard
 */
export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { session, isInitialized } = useAuthStore();
  const { showToast, setPendingInviteToken } = useUiStore();
  const joinByToken = useJoinByToken();

  const [status, setStatus] = useState<'waiting' | 'joining' | 'error' | 'already_member'>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const hasAttempted = useRef(false);
  const [linkChecked, setLinkChecked] = useState(false);
  const [linkSession, setLinkSession] = useState<Session | null>(null);

  // -- Extraction de session depuis le magic link deep link --
  useEffect(() => {
    let cancelled = false;

    async function handleUrl(url: string) {
      if (cancelled) return;
      const hash = url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!cancelled && data.session) setLinkSession(data.session);
        }
      }
      if (!cancelled) setLinkChecked(true);
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url).catch(() => {
        if (!cancelled) setLinkChecked(true);
      });
    });

    Linking.getInitialURL()
      .then(async (url) => {
        if (!cancelled && url) {
          await handleUrl(url);
        } else if (!cancelled) {
          setLinkChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLinkChecked(true);
      });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  // -- Logique principale --
  useEffect(() => {
    if (!linkChecked || !isInitialized || !token) return;

    const activeSession = session || linkSession;

    if (!activeSession) {
      // Pas de session → fallback vers signup
      setPendingInviteToken(token);
      router.replace(`/(auth)/signup?invite=${token}`);
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // Session disponible → rejoindre le foyer
    setStatus('joining');
    joinByToken
      .mutateAsync(token)
      .then(({ alreadyMember, household }) => {
        setPendingInviteToken(null);
        if (alreadyMember) {
          setStatus('already_member');
          setHouseholdName(household?.name ?? 'ce foyer');
        } else {
          const { completedJoinOnboardingForHouseholds } = useUiStore.getState();
          if (household && completedJoinOnboardingForHouseholds.includes(household.id)) {
            showToast('Bienvenue dans le foyer !', 'success');
            router.replace('/(app)/dashboard');
          } else {
            router.replace('/(app)/onboarding/post-join');
          }
        }
      })
      .catch((err) => {
        // Clear pending token to avoid circular redirect:
        // error → auth/login → (auth)/_layout detects token → /join/TOKEN → error
        setPendingInviteToken(null);
        setStatus('error');
        setErrorMsg((err as Error).message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkChecked, isInitialized, session, linkSession, token]);

  // -- Render --

  if (status === 'waiting' || status === 'joining') {
    return (
      <Loader
        fullScreen
        label={status === 'joining' ? 'Rejoindre le foyer...' : "Traitement de l'invitation..."}
      />
    );
  }

  if (status === 'already_member') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.title}>Deja membre</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Vous faites deja partie de {householdName}.
          </Text>
          <Button
            label="Aller au dashboard"
            variant="primary"
            onPress={() => router.replace('/(app)/dashboard')}
            style={styles.btn}
          />
          <Button
            label="Retour a l'accueil"
            variant="ghost"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Mascot size={100} expression="thinking" />
        <Text variant="h3" style={styles.title}>Invitation invalide</Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {errorMsg}
        </Text>
        <Button
          label="Retour a l'accueil"
          variant="primary"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: Spacing.lg,
    width: '100%',
  },
});
