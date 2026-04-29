import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '../../../src/lib/supabase/auth';
import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Card } from '../../../src/components/ui/Card';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}

function SettingsRow({ icon, label, onPress, color, danger }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: (color ?? Colors.primary) + '18' }]}>
        <Ionicons name={icon} size={18} color={color ?? Colors.primary} />
      </View>
      <Text
        variant="body"
        style={[styles.rowLabel, danger ? { color: Colors.error } : undefined]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user } = useCurrentUser();
  const resetAuth = useAuthStore((s) => s.reset);
  const resetHousehold = useHouseholdStore((s) => s.reset);
  const { showToast, setPendingInviteToken, setPendingInviteCode } = useUiStore();

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata as Record<string, string> | undefined)?.full_name?.trim() ||
    'Utilisateur';

  const doSignOut = async () => {
    // Reset local state first — supabase.auth.signOut() can hang on web
    setPendingInviteToken(null);
    setPendingInviteCode(null);
    resetHousehold();
    resetAuth();
    router.replace('/(auth)/login');

    // Fire-and-forget server sign out
    try {
      await signOut();
    } catch {
      // Ignore — local state already cleared
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tu vas etre deconnecte·e. Continuer ?')) {
        doSignOut();
      }
      return;
    }
    Alert.alert('Se deconnecter', 'Tu vas etre deconnecte·e. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se deconnecter',
        style: 'destructive',
        onPress: doSignOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text variant="h2" style={styles.title}>Profil</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <Avatar
            name={profile?.full_name}
            avatarUrl={profile?.avatar_url}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text variant="h3">{displayName}</Text>
            <Text variant="bodySmall" color="secondary">
              {profile?.email ?? ''}
            </Text>
          </View>
        </Card>

        {/* Menu */}
        <View style={styles.section}>
          <SettingsRow
            icon="person-outline"
            label="Modifier le profil"
            onPress={() => router.push('/(app)/settings/profile')}
          />
          <SettingsRow
            icon="home-outline"
            label="Mon foyer"
            onPress={() => router.push('/(app)/settings/household')}
          />
          <SettingsRow
            icon="mail-outline"
            label="Invitations"
            onPress={() => router.push('/(app)/settings/invite')}
            color={Colors.joy}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Securite"
            onPress={() => router.push('/(app)/settings/security')}
            color={Colors.primary}
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(app)/settings/notifications')}
            color={Colors.accent}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon="help-circle-outline"
            label="Aide"
            onPress={() => router.push('/(app)/settings/help')}
            color={Colors.textSecondary}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Conditions d'utilisation"
            onPress={() => router.push('/(app)/settings/cgu')}
            color={Colors.textSecondary}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Politique de confidentialité"
            onPress={() => router.push('/(app)/settings/privacy')}
            color={Colors.textSecondary}
          />
          <SettingsRow
            icon="log-out-outline"
            label="Se deconnecter"
            onPress={handleSignOut}
            color={Colors.error}
            danger
          />
        </View>

        <View style={[styles.section, styles.dangerSection]}>
          <SettingsRow
            icon="trash-outline"
            label="Supprimer mon compte"
            onPress={() => router.push('/(app)/settings/delete-account')}
            color={Colors.error}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    paddingVertical: Spacing.base,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  dangerSection: {
    borderColor: Colors.error,
    marginTop: Spacing.md,
  },
});
