import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/stores/auth.store';
import { updateProfile } from '../../../src/lib/supabase/auth';
import { supabase } from '../../../src/lib/supabase/client';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, setProfile } = useAuthStore();
  const { showToast } = useUiStore();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: fullName });
    if (error) {
      showToast(error, 'error');
    } else {
      if (profile) setProfile({ ...profile, full_name: fullName });
      showToast('Profil mis à jour !', 'success');
    }
    setSaving(false);
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileName = `${user?.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;

      await updateProfile(user!.id, { avatar_url: avatarUrl });
      if (profile) setProfile({ ...profile, avatar_url: avatarUrl });
      showToast('Avatar mis à jour !', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur upload', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h3">Mon profil</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.avatarSection}>
          <Avatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="xl" />
          <Button
            label={uploadingAvatar ? 'Upload...' : 'Changer la photo'}
            variant="ghost"
            size="sm"
            onPress={handlePickAvatar}
            isLoading={uploadingAvatar}
          />
        </View>

        <View style={styles.form}>
          <Input
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Prénom Nom"
            leftIcon="person-outline"
          />
          <Input
            label="Email"
            value={profile?.email ?? ''}
            editable={false}
            leftIcon="mail-outline"
            containerStyle={{ opacity: 0.6 }}
          />
          <Button label="Sauvegarder" onPress={handleSave} isLoading={saving} fullWidth size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'], gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  form: { gap: Spacing.base },
});
