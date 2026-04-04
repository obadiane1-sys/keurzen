import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
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

  // Staggered fade-in animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

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

  // Start entry animations
  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim3, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim4, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4]);

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
        ? `${preview.inviter_name} vous invite à rejoindre le foyer "${preview.household_name}"`
        : preview.household_name
          ? `Vous avez été invité(e) à rejoindre le foyer "${preview.household_name}"`
          : 'Vous avez été invité(e) à rejoindre un foyer Keurzen.'
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Decorative blobs */}
      <View style={styles.blobMint} />
      <View style={styles.blobLavender} />
      <View style={styles.blobCoral} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Invite banner + Back */}
          <Animated.View style={{ opacity: fadeAnim1 }}>
            {effectiveToken && (
              <View style={styles.inviteBanner}>
                <Ionicons name="mail-unread-outline" size={16} color={Colors.sauge} />
                <Text variant="bodySmall" style={styles.inviteBannerText}>
                  {inviteContext ?? 'Vous avez été invité(e) à rejoindre un foyer Keurzen.'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text variant="label" color="terracotta">
                ← Retour
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim2 }]}>
            <Mascot size={100} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Créer mon compte
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {effectiveToken
                ? 'Créez votre compte pour rejoindre le foyer.'
                : 'Rejoignez Keurzen et organisez votre foyer en équipe.'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.form, { opacity: fadeAnim3 }]}>
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
                    Un compte existe déjà avec cette adresse email.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="bodySmall" color="terracotta" style={{ fontWeight: '600' }}>
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

            {effectiveToken && (
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={styles.loginLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="bodySmall" color="muted">
                  {"J'ai déjà un compte \u2014 "}
                  <Text variant="bodySmall" color="terracotta">
                    Se connecter
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ opacity: fadeAnim4 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/join-code')}
              style={styles.joinCodeLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="key-outline" size={14} color={Colors.terracotta} />
              <Text variant="bodySmall" color="terracotta" weight="semibold">
                J'ai un code d'invitation
              </Text>
            </TouchableOpacity>

            <Text variant="caption" color="muted" style={styles.legal}>
              {"En créant un compte, vous acceptez nos "}
              <Text variant="caption" color="terracotta">
                {"Conditions d'utilisation"}
              </Text>
              {' et notre '}
              <Text variant="caption" color="terracotta">
                Politique de confidentialité
              </Text>
              .
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
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
    backgroundColor: Colors.sauge + '18',
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
  // Decorative blobs
  blobMint: {
    position: 'absolute',
    top: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sauge,
    opacity: 0.1,
  },
  blobLavender: {
    position: 'absolute',
    top: '35%',
    right: -60,
    width: 200,
    height: 200,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.prune,
    opacity: 0.08,
  },
  blobCoral: {
    position: 'absolute',
    bottom: 40,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.rose,
    opacity: 0.09,
  },
});
