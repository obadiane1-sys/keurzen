import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { useJoinByToken } from '../../src/lib/queries/household';
import { supabase } from '../../src/lib/supabase/client';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Loader } from '../../src/components/ui/Loader';
import { Mascot } from '../../src/components/ui/Mascot';

type JoinStatus = 'waiting' | 'form' | 'joining' | 'error';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { session, isInitialized } = useAuthStore();
  const { showToast, setPendingInviteToken } = useUiStore();
  const joinByToken = useJoinByToken();
  const [status, setStatus] = useState<JoinStatus>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  // Garde contre les re-déclenchements multiples quand session change plusieurs fois
  const hasAttempted = useRef(false);
  // Vrai quand l'extraction de session depuis le deep link est terminée
  const [linkChecked, setLinkChecked] = useState(false);
  // Session capturée directement depuis setSession() pour éviter la race condition
  // avec onAuthStateChange qui met à jour le store de façon asynchrone
  const [linkSession, setLinkSession] = useState<Session | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    password?: string;
    confirm?: string;
  }>({});

  // ── Extraction de session depuis le magic link ──────────────────────────
  // Quand Supabase redirige vers keurzen://join/{token}#access_token=...
  // les tokens sont dans le fragment URL. On les lit et on établit la session
  // AVANT que la logique principale ne s'exécute.
  useEffect(() => {
    let cancelled = false;

    async function handleUrl(url: string) {
      if (cancelled) return;
      const hash = url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken  = params.get('access_token');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Logique principale ────────────────────────────────────────────────────
  useEffect(() => {
    if (!linkChecked || !isInitialized || !token) return;

    const activeSession = session || linkSession;

    if (!activeSession) {
      // Aucune session disponible — fallback vers le signup
      setPendingInviteToken(token);
      router.replace(`/(auth)/signup?invite=${token}`);
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // Session disponible → afficher le formulaire de finalisation
    setStatus('form');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkChecked, isInitialized, session, linkSession, token]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!firstName.trim()) errors.firstName = 'Le prénom est obligatoire';
    if (password.length < 6) errors.password = 'Minimum 6 caractères';
    if (password !== confirmPassword) errors.confirm = 'Les mots de passe ne correspondent pas';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate() || !token) return;
    setStatus('joining');
    setErrorMsg('');
    try {
      // 1. Définir le mot de passe
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw new Error(pwError.message);

      // 2. Mettre à jour le prénom dans le profil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ first_name: firstName.trim() })
          .eq('id', user.id);
      }

      // 3. Rejoindre le foyer
      const { alreadyMember } = await joinByToken.mutateAsync(token);
      setPendingInviteToken(null);

      if (alreadyMember) {
        showToast('Vous êtes déjà membre de ce foyer', 'info');
      } else {
        showToast('Bienvenue dans le foyer !', 'success');
      }
      router.replace('/(app)/dashboard');
    } catch (err) {
      setStatus('form');
      setErrorMsg((err as Error).message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (status === 'waiting' || status === 'joining') {
    return (
      <Loader
        fullScreen
        label={status === 'joining' ? 'Finalisation en cours…' : "Traitement de l'invitation..."}
      />
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Mascot size={100} expression="thinking" />
          <Text variant="h3" style={styles.title}>Invitation invalide</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {errorMsg}
          </Text>
          <Button
            label="Retour à l'accueil"
            variant="primary"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.btn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Mascot size={80} expression="happy" />

          <Text variant="h3" style={styles.title}>Finalisez votre compte</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Choisissez un prénom et un mot de passe pour rejoindre le foyer.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text variant="bodySmall" style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Prénom"
              placeholder="Votre prénom"
              value={firstName}
              onChangeText={setFirstName}
              error={fieldErrors.firstName}
              autoCapitalize="words"
              leftIcon="person-outline"
            />
            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              isPassword
              leftIcon="lock-closed-outline"
            />
            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={fieldErrors.confirm}
              isPassword
              leftIcon="lock-closed-outline"
            />
          </View>

          <Button
            label="Rejoindre le foyer"
            variant="primary"
            onPress={handleSubmit}
            disabled={!isFormValid}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    gap: Spacing.base,
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
  form: {
    width: '100%',
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
  errorBox: {
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    width: '100%',
  },
  errorText: {
    color: Colors.error,
  },
  btn: {
    marginTop: Spacing.lg,
    width: '100%',
  },
});
