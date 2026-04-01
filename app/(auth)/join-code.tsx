import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { supabase, supabaseAnonKey, supabaseUrl } from '../../src/lib/supabase/client';

const CODE_LENGTH = 6;

export default function JoinCodeScreen() {
  const router = useRouter();
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const { session } = useAuthStore();
  const { showToast, setPendingInviteCode } = useUiStore();
  const [isJoining, setIsJoining] = useState(false);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Read code from URL params (email CTA link) and pre-fill
  useEffect(() => {
    // Also check window.location on web for immediate access
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

  // Auto-submit when pre-filled from URL (Edge Function gere auth si pas de session)
  useEffect(() => {
    if (isComplete && !autoSubmitted && codeParam && !isJoining) {
      setAutoSubmitted(true);
      // Defer to next tick to ensure state is fully settled
      const timer = setTimeout(() => handleSubmit(), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, autoSubmitted, isJoining]);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-focus next
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (cleaned.length > 0) {
      const newDigits = Array(CODE_LENGTH).fill('');
      for (let i = 0; i < cleaned.length; i++) {
        newDigits[i] = cleaned[i];
      }
      setDigits(newDigits);
      // Focus last filled or next empty
      const focusIndex = Math.min(cleaned.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!isComplete || isJoining) return;

    const currentCode = digits.join('');
    setIsJoining(true);
    setError(null);

    try {
      // Always use direct fetch — supabase.rpc and supabase.functions.invoke hang on web
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        'x-app-name': 'keurzen-mobile',
      };

      // Include auth header if user already has a session
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

      const payload = (await res.json()) as {
        success?: boolean;
        access_token?: string;
        refresh_token?: string;
        household?: object;
        already_member?: boolean;
        error?: string;
      };

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
          // setSession may have succeeded despite timeout — verify
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            sessionEstablished = true;
          } else {
            // One retry attempt
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
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              sessionEstablished = !!retrySession;
            }
          }
        }

        if (!sessionEstablished) {
          setError('Impossible d\'etablir la session. Verifiez votre connexion et reessayez.');
          setIsJoining(false);
          return;
        }
      }

      setPendingInviteCode(null);

      if (payload.already_member) {
        showToast('Vous faites deja partie de ce foyer', 'info');
      } else {
        showToast('Bienvenue dans le foyer !', 'success');
      }

      router.replace('/(app)/dashboard');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('aborted') || msg.includes('abort')) {
        setError('Le serveur met trop de temps a repondre. Reessayez.');
      } else {
        setError(msg);
      }
    } finally {
      setIsJoining(false);
    }
  };

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
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Text variant="label" color="mint">
              ← Retour
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Mascot size={72} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Rejoindre un foyer
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Saisissez le code a 6 chiffres que vous avez recu par email.
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.codeRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeCell,
                  digit ? styles.codeCellFilled : undefined,
                  error ? styles.codeCellError : undefined,
                ]}
                value={digit}
                onChangeText={(text) => {
                  // Handle paste (multi-char input)
                  if (text.length > 1) {
                    handlePaste(text);
                  } else {
                    handleChange(text, index);
                  }
                }}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                textContentType="oneTimeCode"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                selectionColor={Colors.mint}
                accessibilityLabel={`Chiffre ${index + 1}`}
              />
            ))}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text variant="bodySmall" style={{ color: Colors.error, flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Submit */}
          <Button
            label="Rejoindre le foyer"
            onPress={handleSubmit}
            isLoading={isJoining}
            fullWidth
            size="lg"
            disabled={!isComplete}
            style={styles.submitBtn}
          />

          {/* Info : le compte est cree automatiquement */}
          {!session && (
            <Text variant="bodySmall" color="muted" style={styles.autoCreateHint}>
              Votre compte sera cree automatiquement.
            </Text>
          )}
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
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeCell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    textAlign: 'center',
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.navy,
    ...Shadows.sm,
  },
  codeCellFilled: {
    borderColor: Colors.mint,
    backgroundColor: Colors.mint + '08',
  },
  codeCellError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '08',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  autoCreateHint: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
