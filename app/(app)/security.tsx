import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePassword } from '../../src/lib/supabase/auth';
import { newPasswordSchema } from '../../src/utils/validation';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export default function SecuritySetupScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordForm) => {
    const { error } = await updatePassword(values.password);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Mot de passe défini !', 'success');
      useAuthStore.getState().setNeedsPasswordSetup(false);
      router.replace('/(app)/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Mascot size={80} expression="happy" />
          <Text variant="h2" style={styles.title}>Sécurisez votre compte</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Définissez un mot de passe pour accéder à votre foyer.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nouveau mot de passe"
                placeholder="••••••••••••"
                isPassword
                leftIcon="lock-closed-outline"
                hint="12 car. min · maj · chiffre · symbole"
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
                containerStyle={{ marginTop: Spacing.base }}
              />
            )}
          />

          <Button
            label="Accéder à mon foyer"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.base }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: { textAlign: 'center', marginTop: Spacing.base },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  form: { gap: Spacing.base },
});
