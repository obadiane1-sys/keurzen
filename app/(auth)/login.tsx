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
import { sendOtp } from '../../src/lib/supabase/auth';
import { signInSchema } from '../../src/utils/validation';
import { useUiStore } from '../../src/stores/ui.store';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import KeurzenMascot from '../../src/components/ui/KeurzenMascot';
import type { SignInFormValues } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: SignInFormValues) => {
    const { error } = await sendOtp(values.email);
    if (error) {
      showToast(error, 'error');
      return;
    }
    router.replace({
      pathname: '/(auth)/verify-email',
      params: { email: values.email },
    });
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
          {/* Header */}
          <View style={styles.header}>
            <KeurzenMascot size={100} expression="happy" animated />
            <Text variant="h2" style={styles.title}>
              Bon retour !
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Entrez votre email pour recevoir un code de connexion.
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

            <Button
              label="Continuer"
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* Join code */}
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

          {/* Footer */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={styles.signupLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="body" color="muted">
              {'Pas encore de compte ? '}
              <Text variant="body" color="mint">
                Creer un compte
              </Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
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
  joinCodeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
