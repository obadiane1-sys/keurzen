import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePassword } from '../../../src/lib/supabase/auth';
import { newPasswordSchema } from '../../../src/utils/validation';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export default function SecurityScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();

  const {
    control,
    handleSubmit,
    reset,
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
      showToast('Mot de passe mis à jour !', 'success');
      reset();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Sécurité</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card>
          <Text variant="h4" style={{ marginBottom: Spacing.base }}>Changer le mot de passe</Text>

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
            label="Mettre à jour"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.base }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
});
