import React from 'react';
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
import { signIn } from '../../src/lib/supabase/auth';
import { signInSchema } from '../../src/utils/validation';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';
import { Mascot } from '../../src/components/ui/Mascot';
import type { SignInFormValues } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast, pendingInviteToken } = useUiStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInFormValues) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      showToast(error, 'error');
    }
    // Auth state change will handle redirect via _layout
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
          {/* Bannière d'invitation */}
          {pendingInviteToken && (
            <View style={styles.inviteBanner}>
              <Ionicons name="mail-unread-outline" size={16} color={Colors.mint} />
              <Text variant="bodySmall" style={styles.inviteBannerText}>
                Vous avez été invité(e) à rejoindre un foyer Keurzen. Connectez-vous pour accepter.
              </Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <Mascot size={72} expression="calm" />
            <Text variant="h2" style={styles.title}>
              Bonjour 👋
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Connectez-vous pour retrouver votre foyer Keurzen.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Mot de passe"
                  placeholder="••••••••••••"
                  isPassword
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
            >
              <Text variant="bodySmall" color="mint" weight="semibold">
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            <Button
              label="Se connecter"
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Divider label="Nouveau sur Keurzen ?" />
            <Button
              label="Créer un compte"
              onPress={() =>
                pendingInviteToken
                  ? router.push(`/(auth)/signup?invite=${pendingInviteToken}`)
                  : router.push('/(auth)/signup')
              }
              variant="outline"
              fullWidth
              size="lg"
            />
          </View>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
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
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  footer: {
    marginTop: Spacing['2xl'],
    gap: Spacing.base,
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
});
