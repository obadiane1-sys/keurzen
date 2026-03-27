import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestPasswordReset } from '../../src/lib/supabase/auth';
import { resetPasswordSchema } from '../../src/utils/validation';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { Card } from '../../src/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import type { ResetPasswordFormValues } from '../../src/types';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    // Appel silencieux — on affiche toujours le même message
    await requestPasswordReset(values.email);
    setSubmitted(true);
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="label" color="mint">← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Mascot size={72} expression={submitted ? 'happy' : 'calm'} />
            <Text variant="h2" style={styles.title}>
              {submitted ? 'Email envoyé !' : 'Réinitialiser'}
            </Text>
          </View>

          {submitted ? (
            <Card style={styles.successCard} radius="xl">
              <View style={styles.successContent}>
                <Ionicons name="mail-outline" size={32} color={Colors.mint} />
                <Text variant="body" style={styles.successText}>
                  Si un compte est associé à cet email, vous recevrez un lien pour réinitialiser votre mot de passe dans quelques minutes.
                </Text>
                <Text variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
                  Vérifiez aussi vos spams.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.form}>
              <Text variant="body" color="secondary" style={styles.description}>
                Entrez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.
              </Text>

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
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Button
                label="Envoyer le lien"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                fullWidth
                size="lg"
              />
            </View>
          )}

          <Button
            label="Retour à la connexion"
            onPress={() => router.replace('/(auth)/login')}
            variant="ghost"
            fullWidth
            style={styles.returnBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  form: {
    gap: Spacing.base,
  },
  successCard: {
    marginTop: Spacing.base,
  },
  successContent: {
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.sm,
  },
  successText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  returnBtn: {
    marginTop: Spacing['2xl'],
  },
});
