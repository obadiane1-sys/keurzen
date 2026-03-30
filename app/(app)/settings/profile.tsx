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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser } from '../../../src/hooks/useAuth';
import { updateProfile, fetchProfile } from '../../../src/lib/supabase/auth';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing } from '../../../src/constants/tokens';
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
            <Text variant="label" color="mint">← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Avatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="xl" />
            <Text variant="h2" style={styles.title}>Mon profil</Text>
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
  form: { gap: Spacing.base },
});
