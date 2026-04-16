import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyOtp, sendOtp, sendOtpForLogin } from '../../src/lib/supabase/auth';
import { useUiStore } from '../../src/stores/ui.store';
import type { RelativePathString } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { OTPInput } from '../../src/components/ui/OTPInput';

const RESEND_COOLDOWN = 30;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{ email?: string; mode?: string }>();
  const { showToast, pendingInviteToken, pendingInviteCode } = useUiStore();

  const resolvedEmail: string =
    email ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('email') ?? '')
      : '');

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Staggered fade-in animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim3, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim4, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    if (code.length < 6) {
      showToast('Entrez les 6 chiffres du code', 'error');
      return;
    }

    setIsVerifying(true);
    setHasError(false);

    const { error } = await verifyOtp(resolvedEmail, code);

    setIsVerifying(false);

    if (error) {
      setHasError(true);
      setCode('');
      showToast(error, 'error');
      return;
    }

    showToast('Connexion réussie !', 'success');

    if (pendingInviteToken) {
      router.replace(`/join/${pendingInviteToken}` as RelativePathString);
    } else if (pendingInviteCode) {
      router.replace(`/(auth)/join-code?code=${pendingInviteCode}` as RelativePathString);
    } else {
      router.replace('/(app)/dashboard');
    }
  }, [code, resolvedEmail, showToast, router, pendingInviteToken, pendingInviteCode]);

  const handleResend = useCallback(async () => {
    if (!resolvedEmail || cooldown > 0) return;
    setIsResending(true);

    const resendFn = mode === 'signup' ? sendOtp : sendOtpForLogin;
    const { error } = await resendFn(resolvedEmail);

    setIsResending(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Nouveau code envoyé. Vérifiez vos emails.', 'success');
      setCode('');
      setCooldown(RESEND_COOLDOWN);
    }
  }, [resolvedEmail, cooldown, showToast]);

  const displayEmail = resolvedEmail || '';

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
          {/* Back */}
          <Animated.View style={{ opacity: fadeAnim1 }}>
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
          <Animated.View style={[styles.header, { opacity: fadeAnim1 }]}>
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Vérifiez vos emails
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {'Entrez le code à 6 chiffres envoyé à '}
              <Text variant="body" style={styles.emailHighlight}>
                {displayEmail || 'votre adresse email'}
              </Text>
            </Text>
          </Animated.View>

          {/* OTP */}
          <Animated.View style={[styles.otpContainer, { opacity: fadeAnim2 }]}>
            <OTPInput
              value={code}
              onChange={(val) => {
                setCode(val);
                if (hasError) setHasError(false);
              }}
              hasError={hasError}
              autoFocus
            />
          </Animated.View>

          {/* Bouton Verifier */}
          <Animated.View style={{ opacity: fadeAnim3 }}>
            <Button
              label="Vérifier le code"
              onPress={handleVerify}
              isLoading={isVerifying}
              fullWidth
              size="lg"
              disabled={code.length < 6}
              style={styles.verifyBtn}
            />
          </Animated.View>

          {/* Renvoyer + validity */}
          <Animated.View style={{ opacity: fadeAnim4 }}>
            <View style={styles.resendRow}>
              <Text variant="bodySmall" color="muted">
                Vous n'avez pas reçu le code ?{' '}
              </Text>
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : cooldown > 0 ? (
                <Text variant="bodySmall" color="muted">
                  Renvoyer dans {cooldown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text variant="bodySmall" color="terracotta" style={styles.resendLink}>
                    Renvoyer
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text variant="caption" color="muted" style={styles.validity}>
              Le code est valable 30 minutes.
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: Spacing['2xl'],
  },
  verifyBtn: {
    marginBottom: Spacing.xl,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resendLink: {
    fontWeight: '600',
  },
  validity: {
    textAlign: 'center',
  },
  // Decorative blobs
  blobMint: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  blobLavender: {
    position: 'absolute',
    bottom: 100,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  blobCoral: {
    position: 'absolute',
    top: '50%',
    right: -40,
    width: 130,
    height: 130,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    opacity: 0.09,
  },
});
