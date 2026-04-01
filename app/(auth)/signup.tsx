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
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../../src/lib/supabase/auth';
import { supabase } from '../../src/lib/supabase/client';
import { signUpSchema } from '../../src/utils/validation';
import { useUiStore } from '../../src/stores/ui.store';
import { useInvitePreview } from '../../src/lib/queries/household';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import type { SignUpFormValues } from '../../src/types';

export default function SignupScreen() {
  const router = useRouter();
  const { invite, email: emailParam } = useLocalSearchParams<{
    invite?: string;
    email?: string;
  }>();
  const { showToast, pendingInviteToken, setPendingInviteToken } = useUiStore();
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  const resolvedEmail: string | undefined =
    emailParam ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('email') ?? undefined)
      : undefined);

  const resolvedInvite: string | undefined =
    invite ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('invite') ?? undefined)
      : undefined);

  const effectiveToken = resolvedInvite || pendingInviteToken;

  // Sync invite token to store
  useEffect(() => {
    if (resolvedInvite && resolvedInvite !== pendingInviteToken) {
      setPendingInviteToken(resolvedInvite);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    },
  });

  useEffect(() => {
    const email = resolvedEmail ?? preview?.invited_email;
    if (email) {
      setValue('email', email, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmail, preview?.invited_email]);

  const onSubmit = async (values: SignUpFormValues) => {
    // Pre-check: verify email is not already registered before sending OTP
    try {
      const { data: exists } = await supabase.rpc('check_email_registered', {
        p_email: values.email,
      });
      if (exists) {
        setEmailAlreadyExists(true);
        return;
      }
    } catch {
      // If RPC fails, fall through to signUp which has its own detection
    }

    const { error } = await signUp(values.email, values.full_name);

    if (error) {
      if (
        error.toLowerCase().includes('already registered') ||
        error.toLowerCase().includes('already exists')
      ) {
        setEmailAlreadyExists(true);
      } else {
        showToast(error, 'error');
      }
      return;
    }

    router.replace({
      pathname: '/(auth)/verify-email',
      params: { email: values.email, mode: 'signup' },
    });
  };

  const knownEmail = resolvedEmail || preview?.invited_email;
  const emailLocked = !!(effectiveToken && knownEmail);

  const inviteContext =
    effectiveToken && preview?.valid
      ? preview.inviter_name && preview.household_name
        ? `${preview.inviter_name} vous invite \u00e0 rejoindre le foyer "${preview.household_name}"`
        : preview.household_name
          ? `Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre le foyer "${preview.household_name}"`
          : 'Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre un foyer Keurzen.'
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
          {/* Invite banner */}
          {effectiveToken && (
            <View style={styles.inviteBanner}>
              <Ionicons name="mail-unread-outline" size={16} color={Colors.mint} />
              <Text variant="bodySmall" style={styles.inviteBannerText}>
                {inviteContext ?? 'Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre un foyer Keurzen.'}
              </Text>
            </View>
          )}

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="label" color="mint">
              ← Retour
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Mascot size={100} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Cr\u00e9er mon compte
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {effectiveToken
                ? 'Cr\u00e9ez votre compte pour rejoindre le foyer.'
                : 'Rejoignez Keurzen et organisez votre foyer en \u00e9quipe.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Pr\u00e9nom et nom"
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
                  onChangeText={(v) => {
                    setEmailAlreadyExists(false);
                    onChange(v);
                  }}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  editable={!emailLocked}
                />
              )}
            />

            {emailAlreadyExists && (
              <View style={styles.emailExistsBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <View style={styles.emailExistsBannerContent}>
                  <Text variant="bodySmall" style={{ color: Colors.textPrimary }}>
                    Un compte existe d\u00e9j\u00e0 avec cette adresse email.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="bodySmall" color="mint" style={{ fontWeight: '600' }}>
                      Se connecter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Button
              label={effectiveToken ? 'Cr\u00e9er mon compte et rejoindre' : 'Cr\u00e9er mon compte'}
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            {effectiveToken && (
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={styles.loginLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="bodySmall" color="muted">
                  {"J'ai d\u00e9j\u00e0 un compte \u2014 "}
                  <Text variant="bodySmall" color="mint">
                    Se connecter
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Join code link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/join-code')}
            style={styles.joinCodeLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="key-outline" size={14} color={Colors.mint} />
            <Text variant="bodySmall" color="mint" weight="semibold">
              J'ai un code d'invitation
            </Text>
          </TouchableOpacity>

          {/* Legal */}
          <Text variant="caption" color="muted" style={styles.legal}>
            {"En cr\u00e9ant un compte, vous acceptez nos "}
            <Text variant="caption" color="mint">
              {"Conditions d'utilisation"}
            </Text>
            {' et notre '}
            <Text variant="caption" color="mint">
              Politique de confidentialit\u00e9
            </Text>
            .
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
  joinCodeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
