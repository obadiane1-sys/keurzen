import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyOtp, sendOtp } from '../../src/lib/supabase/auth';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { OTPInput } from '../../src/components/ui/OTPInput';

const RESEND_COOLDOWN = 30;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { showToast } = useUiStore();

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

    showToast('Connexion reussie !', 'success');
    router.replace('/(app)/dashboard');
  }, [code, resolvedEmail, showToast, router]);

  const handleResend = useCallback(async () => {
    if (!resolvedEmail || cooldown > 0) return;
    setIsResending(true);

    const { error } = await sendOtp(resolvedEmail);

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
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Verifiez vos emails
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {'Entrez le code à 6 chiffres envoyé à '}
              <Text variant="body" style={styles.emailHighlight}>
                {displayEmail || 'votre adresse email'}
              </Text>
            </Text>
          </View>

          {/* OTP */}
          <View style={styles.otpContainer}>
            <OTPInput
              value={code}
              onChange={(val) => {
                setCode(val);
                if (hasError) setHasError(false);
              }}
              hasError={hasError}
              autoFocus
            />
          </View>

          {/* Bouton Vérifier */}
          <Button
            label="Verifier le code"
            onPress={handleVerify}
            isLoading={isVerifying}
            fullWidth
            size="lg"
            disabled={code.length < 6}
            style={styles.verifyBtn}
          />

          {/* Renvoyer */}
          <View style={styles.resendRow}>
            <Text variant="bodySmall" color="muted">
              Vous n'avez pas reçu le code ?{' '}
            </Text>
            {isResending ? (
              <ActivityIndicator size="small" color={Colors.mint} />
            ) : cooldown > 0 ? (
              <Text variant="bodySmall" color="muted">
                Renvoyer dans {cooldown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="bodySmall" color="mint" style={styles.resendLink}>
                  Renvoyer
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text variant="caption" color="muted" style={styles.validity}>
            Le code est valable 30 minutes.
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: Colors.navy,
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
});
