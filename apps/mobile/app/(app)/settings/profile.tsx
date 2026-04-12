import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentUser } from '../../../src/hooks/useAuth';
import { updateProfile, fetchProfile } from '../../../src/lib/supabase/auth';
import { supabase } from '../../../src/lib/supabase/client';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useCurrentUser();
  const { setProfile } = useAuthStore();
  const { showToast } = useUiStore();
  const [fullName, setFullName] = React.useState(profile?.full_name ?? '');
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = React.useState<string | null>(null);

  const displayAvatarUrl = localAvatarUrl ?? profile?.avatar_url ?? null;

  const pickAndUploadAvatar = async () => {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Permission requise pour accéder aux photos.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      // Fetch the image as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer for Supabase upload
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile in DB
      const { error: profileError } = await updateProfile(user.id, {
        avatar_url: publicUrl,
      });

      if (profileError) throw new Error(profileError);

      setLocalAvatarUrl(publicUrl);

      // Refresh profile in store
      const updated = await fetchProfile(user.id);
      if (updated) setProfile(updated);

      showToast('Photo de profil mise à jour.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: fullName.trim() });
    if (error) {
      showToast(error, 'error');
    } else {
      const updated = await fetchProfile(user.id);
      if (updated) setProfile(updated);
      showToast('Profil mis a jour.', 'success');
      router.back();
    }
    setSaving(false);
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
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="label" color="terracotta">← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            {/* Avatar with edit overlay */}
            <TouchableOpacity
              onPress={pickAndUploadAvatar}
              disabled={uploading}
              activeOpacity={0.8}
              style={styles.avatarContainer}
            >
              <Avatar
                name={profile?.full_name}
                avatarUrl={displayAvatarUrl}
                size="xl"
              />
              <View style={styles.avatarOverlay}>
                {uploading ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <Ionicons name="camera" size={16} color={Colors.textInverse} />
                )}
              </View>
            </TouchableOpacity>
            <Text variant="h2" style={styles.title}>Mon profil</Text>
            <Text variant="caption" color="muted">
              Appuyez sur la photo pour la modifier
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Prenom et nom"
              placeholder="Votre nom"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              leftIcon="person-outline"
            />

            <Input
              label="Email"
              value={profile?.email ?? ''}
              editable={false}
              leftIcon="mail-outline"
            />

            <Button
              label="Enregistrer"
              onPress={handleSave}
              isLoading={saving}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>
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
  title: { marginTop: Spacing.base },
  avatarContainer: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  form: { gap: Spacing.base },
});
