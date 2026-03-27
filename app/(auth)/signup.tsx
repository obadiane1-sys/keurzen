import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp, signUpForInvite } from '../../src/lib/supabase/auth';
import { signUpSchema } from '../../src/utils/validation';
import { useUiStore } from '../../src/stores/ui.store';
import { useInvitePreview } from '../../src/lib/queries/household';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import type { SignUpFormValues } from '../../src/types';

export default function SignupScreen() {
  const router = useRouter();
  const { invite, email: emailParam } = useLocalSearchParams<{ invite?: string; email?: string }>();
  const { showToast, pendingInviteToken, setPendingInviteToken } = useUiStore();
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  // Sur web, window.location.search est synchrone et disponible dès le premier
  // rendu, contrairement à useLocalSearchParams qui peut arriver en retard lors
  // d'un fresh load depuis un lien externe (email, SMS).
  const resolvedEmail: string | undefined = emailParam
    ?? (Platform.OS === 'web' && typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('email') ?? undefined)
      : undefined);

  const resolvedInvite: string | undefined = invite
    ?? (Platform.OS === 'web' && typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('invite') ?? undefined)
      : undefined);

  // URL param is the authoritative source — survives Zustand resets and hot reloads.
  // Sync it back to the store so (auth)/_layout.tsx can redirect after auth.
  const effectiveToken = resolvedInvite || pendingInviteToken;

  useEffect(() => {
    if (resolvedInvite && resolvedInvite !== pendingInviteToken) {
      setPendingInviteToken(resolvedInvite);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Récupère le contexte de l'invitation (nom du foyer, invitant, email)
  // pour l'afficher à l'écran et pré-remplir l'email si non fourni en URL param.
  const { data: preview } = useInvitePreview(effectiveToken ?? null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: resolvedEmail ?? '',
      full_name: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Applique l'email dès qu'il est résolu (late arrival sur web ou deep link natif).
  useEffect(() => {
    const email = resolvedEmail ?? preview?.invited_email;
    if (email) {
      setValue('email', email, { shouldValidate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmail, preview?.invited_email]);

  const onSubmit = async (values: SignUpFormValues) => {
    // ── Flow invitation : création directe sans email de confirmation ────────
    if (effectiveToken) {
      const { error } = await signUpForInvite(
        values.email,
        values.password,
        values.full_name,
        effectiveToken,
      );

      if (error === 'already_exists') {
        showToast('Un compte avec cet email existe déjà. Connectez-vous pour rejoindre le foyer.', 'info');
        router.replace('/(auth)/login');
        return;
      }

      if (error) {
        showToast(error, 'error');
        return;
      }

      // Succès : session établie → (auth)/_layout.tsx redirige automatiquement
      // vers /join/{token}?auto=1 qui déclenche le join sans friction.
      return;
    }

    // ── Flow standard : inscription classique ────────────────────────────────
    const { error, requiresConfirmation } = await signUp(values.email, values.password, values.full_name);

    if (error) {
      if (error === 'email_already_exists') {
        setEmailAlreadyExists(true);
      } else if (error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already exists')) {
        setEmailAlreadyExists(true);
      } else {
        showToast(error, 'error');
      }
      return;
    }

    if (requiresConfirmation) {
      // Confirmation email envoyée — l'utilisateur doit cliquer sur le lien
      showToast('Compte créé ! Vérifiez votre email pour confirmer.', 'success');
      router.replace('/(auth)/login');
    }
    // Si requiresConfirmation === false : Supabase a auto-confirmé le compte
    // et la session est déjà établie. onAuthStateChange → (auth)/_layout.tsx
    // gère la redirection automatiquement. Rien d'autre à faire ici.
  };

  // Détermine si l'email doit être verrouillé (connu via URL ou preview)
  const knownEmail = resolvedEmail || preview?.invited_email;
  const emailLocked = !!(effectiveToken && knownEmail);

  // Construit le message contextuel de l'invitation
  const inviteContext = effectiveToken && preview?.valid
    ? preview.inviter_name && preview.household_name
      ? `${preview.inviter_name} vous invite à rejoindre le foyer « ${preview.household_name} »`
      : preview.household_name
        ? `Vous avez été invité(e) à rejoindre le foyer « ${preview.household_name} »`
        : 'Vous avez été invité(e) à rejoindre un foyer Keurzen.'
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière d'invitation contextuelle */}
          {effectiveToken && (
            <View style={styles.inviteBanner}>
              <Ionicons name="mail-unread-outline" size={16} color={Colors.mint} />
              <Text variant="bodySmall" style={styles.inviteBannerText}>
                {inviteContext ?? 'Vous avez été invité(e) à rejoindre un foyer Keurzen.'}
              </Text>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="label" color="mint">← Retour</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Créer mon compte
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {effectiveToken
                ? 'Créez votre compte pour rejoindre le foyer.'
                : 'Rejoignez Keurzen et organisez votre foyer en équipe.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom et nom"
                  placeholder="Marie Dupont"
                  autoComplete="name"
                  autoCapitalize="words"
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.full_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse email"
                  placeholder="vous@exemple.fr"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={(v) => { setEmailAlreadyExists(false); onChange(v); }}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  editable={!emailLocked}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Mot de passe"
                  placeholder="••••••••••••"
                  isPassword
                  leftIcon="lock-closed-outline"
                  hint="12 car. min · maj · chiffre · symbole · sans espace"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmer le mot de passe"
                  placeholder="••••••••••••"
                  isPassword
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {emailAlreadyExists && (
              <View style={styles.emailExistsBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <View style={styles.emailExistsBannerContent}>
                  <Text variant="bodySmall" style={styles.emailExistsBannerText}>
                    Un compte existe déjà avec cette adresse email.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="bodySmall" color="mint" style={styles.emailExistsLoginLink}>
                      Se connecter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Button
              label={effectiveToken ? 'Créer mon compte et rejoindre' : 'Créer mon compte'}
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            {/* Lien "J'ai déjà un compte" — visible uniquement en mode invitation */}
            {effectiveToken && (
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={styles.loginLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="bodySmall" color="muted">
                  {'J\'ai déjà un compte — '}
                  <Text variant="bodySmall" color="mint">Se connecter</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Legal note */}
          <Text
            variant="caption"
            color="muted"
            style={styles.legal}
          >
            En créant un compte, vous acceptez nos{' '}
            <Text variant="caption" color="mint">{"Conditions d'utilisation"}</Text>
            {' '}et notre{' '}
            <Text variant="caption" color="mint">Politique de confidentialité</Text>.
          </Text>
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
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  backBtn: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  title: {
    marginTop: Spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  form: {
    gap: Spacing.base,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  legal: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint + '18',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  inviteBannerText: {
    flex: 1,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  emailExistsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  emailExistsBannerContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  emailExistsBannerText: {
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  emailExistsLoginLink: {
    fontWeight: '600' as const,
  },
});
