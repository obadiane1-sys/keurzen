import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/auth.store';
import { useUiStore } from '../../src/stores/ui.store';
import { updateProfile } from '../../src/lib/supabase/auth';
import { supabase } from '../../src/lib/supabase/client';
import { Colors, Spacing, BorderRadius } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Mascot } from '../../src/components/ui/Mascot';
import { Avatar } from '../../src/components/ui/Avatar';

const setupProfileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(40, 'Trop long'),
  lastName: z.string().max(40, 'Trop long').optional(),
});

type SetupProfileFormValues = z.infer<typeof setupProfileSchema>;

export default function SetupProfileScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const { showToast } = useUiStore();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetupProfileFormValues>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  const firstName = watch('firstName');
  const fullNamePreview = [firstName, watch('lastName')].filter(Boolean).join(' ');

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const showAvatarOptions = () => {
    Alert.alert('Photo de profil', 'Choisir depuis', [
      { text: 'Galerie', onPress: handlePickFromLibrary },
      { text: 'Appareil photo', onPress: handleTakePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const onSubmit = async (values: SetupProfileFormValues) => {
    if (!user?.id) return;

    const fullName = [values.firstName, values.lastName].filter(Boolean).join(' ');

    let avatarUrl: string | undefined;
    if (avatarUri) {
      setUploadingAvatar(true);
      try {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const filePath = `avatars/${fileName}`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erreur upload avatar', 'error');
        setUploadingAvatar(false);
        return;
      }
      setUploadingAvatar(false);
    }

    const profileUpdates: { full_name: string; avatar_url?: string } = { full_name: fullName };
    if (avatarUrl) profileUpdates.avatar_url = avatarUrl;

    const { error: profileError } = await updateProfile(user.id, profileUpdates);
    if (profileError) {
      showToast(profileError, 'error');
      return;
    }

    if (profile) {
      setProfile({ ...profile, full_name: fullName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) });
    }

    showToast('Profil configuré !', 'success');
    useAuthStore.getState().setNeedsPasswordSetup(true);
    router.replace('/(app)/security');
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
          <View style={styles.header}>
            <Mascot size={80} expression="happy" />
            <Text variant="h2" style={styles.title}>
              Bienvenue dans le foyer !
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Complétez votre profil pour commencer.
            </Text>
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.8} style={styles.avatarWrapper}>
              <Avatar
                name={fullNamePreview || undefined}
                avatarUrl={avatarUri}
                size="xl"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>+</Text>
              </View>
            </TouchableOpacity>
            <Text variant="caption" color="muted">Photo optionnelle</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prénom *"
                  placeholder="Marie"
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom"
                  placeholder="Dupont"
                  leftIcon="person-outline"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                />
              )}
            />

            <Button
              label="Accéder à mon foyer"
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting || uploadingAvatar}
              disabled={!firstName.trim()}
              fullWidth
              size="lg"
              style={styles.submitBtn}
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
    paddingBottom: Spacing.xl,
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
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarBadgeText: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  form: {
    gap: Spacing.base,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
