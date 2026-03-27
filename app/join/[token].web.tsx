import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase/client';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | { kind: 'loading' }
  | { kind: 'no-session' }
  | { kind: 'ready'; userId: string }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function JoinWebScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>({ kind: 'loading' });
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [submitError, setSubmitError] = useState('');

  // ── Étape 1 : extraire le hash et établir la session ──────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') {
      setPageState({ kind: 'no-session' });
      return;
    }

    const hash = window.location.hash.slice(1); // retire '#'
    if (!hash) {
      setPageState({ kind: 'no-session' });
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setPageState({ kind: 'no-session' });
      return;
    }

    // Nettoyer le hash de l'URL sans recharger la page
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.user) {
          setPageState({
            kind: 'error',
            message: error?.message ?? 'Impossible d\'établir la session.',
          });
          return;
        }
        setPageState({ kind: 'ready', userId: data.user.id });
      })
      .catch((err: unknown) => {
        setPageState({
          kind: 'error',
          message: (err as Error).message ?? 'Erreur inattendue.',
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────

  const isFormValid =
    firstName.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!firstName.trim()) errors.firstName = 'Le prénom est obligatoire';
    if (password.length < 6) errors.password = 'Minimum 6 caractères';
    if (password !== confirmPassword)
      errors.confirm = 'Les mots de passe ne correspondent pas';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Soumission ────────────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (!token || !validate() || pageState.kind !== 'ready') return;

    const userId = pageState.userId;
    setPageState({ kind: 'submitting' });

    try {
      // 1. Définir le mot de passe
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw new Error(pwError.message);

      // 2. Mettre à jour le prénom dans le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ first_name: firstName.trim() })
        .eq('id', userId);
      if (profileError) throw new Error(profileError.message);

      // 3. Rejoindre le foyer via RPC
      const { data, error: rpcError } = await supabase.rpc(
        'join_household_by_token',
        { p_token: token }
      );
      if (rpcError) throw new Error(rpcError.message);

      const result = data as {
        error?: string;
        household?: object;
        already_member?: boolean;
      } | null;

      if (!result) throw new Error('Réponse vide du serveur.');
      if (result.error) throw new Error(result.error);

      // 4. Rediriger vers le dashboard
      router.replace('/(app)/dashboard');
    } catch (err) {
      setFieldErrors({});
      setPageState({
        kind: 'ready',
        userId,
      });
      // On affiche l'erreur dans le composant
      setSubmitError((err as Error).message);
    }
  };

  // Réinitialiser l'erreur quand l'utilisateur retape
  useEffect(() => {
    if (submitError) setSubmitError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, password, confirmPassword]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  // État : chargement
  if (pageState.kind === 'loading') {
    return (
      <View style={styles.page}>
        <ActivityIndicator size="large" color={Colors.mint} />
      </View>
    );
  }

  // État : pas de session (lien sans fragment)
  if (pageState.kind === 'no-session') {
    return (
      <View style={styles.page}>
        <View style={styles.card}>
          <BrandHeader />
          <Text variant="h3" style={styles.title}>Lien invalide</Text>
          <Text variant="body" color="secondary">
            Ce lien n&apos;est plus valide. Demandez une nouvelle invitation.
          </Text>
        </View>
      </View>
    );
  }

  // État : erreur d'initialisation
  if (pageState.kind === 'error') {
    return (
      <View style={styles.page}>
        <View style={styles.card}>
          <BrandHeader />
          <Text variant="h3" style={styles.title}>Lien expiré</Text>
          <Text variant="body" color="secondary">{pageState.message}</Text>
          <Text variant="bodySmall" color="muted" style={styles.hint}>
            Ce lien n&apos;est plus valide. Demandez une nouvelle invitation.
          </Text>
        </View>
      </View>
    );
  }

  const isSubmitting = pageState.kind === 'submitting';

  // État : formulaire (ready ou submitting)
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <BrandHeader />

        <Text variant="h2" style={styles.title}>Rejoindre le foyer</Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Créez votre compte pour accéder à votre espace partagé.
        </Text>

        {/* Erreur de soumission */}
        {submitError ? (
          <View style={styles.errorBox}>
            <Text variant="bodySmall" style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* Formulaire */}
        <View style={styles.form}>
          <Input
            label="Prénom"
            placeholder="Votre prénom"
            value={firstName}
            onChangeText={setFirstName}
            error={fieldErrors.firstName}
            autoCapitalize="words"
            leftIcon="person-outline"
            editable={!isSubmitting}
          />
          <Input
            label="Mot de passe"
            placeholder="Minimum 6 caractères"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            isPassword
            leftIcon="lock-closed-outline"
            editable={!isSubmitting}
          />
          <Input
            label="Confirmer le mot de passe"
            placeholder="Répétez le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={fieldErrors.confirm}
            isPassword
            leftIcon="lock-closed-outline"
            editable={!isSubmitting}
          />
        </View>

        {/* Bouton */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            (!isFormValid || isSubmitting) && styles.btnDisabled,
            pressed && isFormValid && !isSubmitting && styles.btnPressed,
          ]}
          onPress={handleJoin}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.navy} />
          ) : (
            <Text style={[styles.btnLabel, styles.btnLabelPrimary]}>
              Rejoindre le foyer
            </Text>
          )}
        </Pressable>

        <Text variant="caption" color="muted" style={styles.footer}>
          Cette invitation est valable 7 jours.
        </Text>
      </View>
    </View>
  );
}

// ─── Brand header sous-composant ──────────────────────────────────────────────

function BrandHeader() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandDot} />
      <Text variant="label" style={styles.brandName}>Keurzen</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 440,
    ...Shadows.lg,
    gap: Spacing.base,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.mint,
  },
  brandName: {
    color: Colors.navy,
    letterSpacing: 0.8,
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    lineHeight: 24,
  },
  hint: {
    marginTop: -Spacing.xs,
  },
  errorBox: {
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
  },
  form: {
    gap: Spacing.base,
    marginTop: Spacing.xs,
  },
  btn: {
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  btnPrimary: {
    backgroundColor: Colors.mint,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnLabelPrimary: {
    color: Colors.navy,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
