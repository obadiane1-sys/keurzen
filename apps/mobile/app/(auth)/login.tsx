import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtpForLogin } from '../../src/lib/supabase/auth';
import { signInSchema } from '../../src/utils/validation';
import { useUiStore } from '../../src/stores/ui.store';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
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

  const [notFound, setNotFound] = useState(false);

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

  const onSubmit = async (values: SignInFormValues) => {
    setNotFound(false);
    const { error } = await sendOtpForLogin(values.email);
    if (error) {
      if (error.includes('Aucun compte')) {
        setNotFound(true);
      } else {
        showToast(error, 'error');
      }
      return;
    }
    router.replace({
      pathname: '/(auth)/verify-email',
      params: { email: values.email, mode: 'login' },
    });
  };

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
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim1 }]}>
            <Mascot size={100} expression="happy" />
          </Animated.View>

          <Animated.View style={[styles.titleBlock, { opacity: fadeAnim2 }]}>
            <Text variant="h2" style={styles.title}>
              Bon retour !
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Entrez votre email pour recevoir un code de connexion.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.form, { opacity: fadeAnim3 }]}>
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

            {notFound && (
              <View style={styles.notFoundBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.rose} />
                <View style={styles.notFoundContent}>
                  <Text variant="bodySmall" style={{ color: Colors.textPrimary }}>
                    Aucun compte trouvé avec cette adresse.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/signup')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="bodySmall" color="terracotta" style={{ fontWeight: '600' }}>
                      Créer un compte
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ opacity: fadeAnim4 }}>
            {/* Join code */}
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

            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              style={styles.signupLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="body" color="muted">
                {'Pas encore de compte ? '}
                <Text variant="body" color="terracotta">
                  Créer un compte
                </Text>
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  titleBlock: {
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
  notFoundBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.rose + '18',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.rose + '40',
  },
  notFoundContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  // Decorative blobs
  blobMint: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    opacity: 0.1,
  },
  blobLavender: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.prune,
    opacity: 0.08,
  },
  blobCoral: {
    position: 'absolute',
    top: '40%',
    left: -30,
    width: 140,
    height: 140,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.rose,
    opacity: 0.08,
  },
});
