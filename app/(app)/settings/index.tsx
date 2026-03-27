import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '../../../src/lib/supabase/auth';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Divider } from '../../../src/components/ui/Divider';
import { Ionicons } from '@expo/vector-icons';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconBg?: string;
  danger?: boolean;
  badge?: string;
}

function SettingsRow({ icon, label, onPress, iconBg = Colors.gray100, danger = false, badge }: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? Colors.error : Colors.textSecondary}
        />
      </View>
      <Text
        variant="label"
        style={[styles.rowLabel, danger && { color: Colors.error }]}
      >
        {label}
      </Text>
      {badge && (
        <View style={styles.badge}>
          <Text variant="caption" style={{ color: Colors.textInverse, fontSize: 10 }}>{badge}</Text>
        </View>
      )}
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, reset: resetAuth } = useAuthStore();
  const { reset: resetHousehold, currentHousehold } = useHouseholdStore();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            queryClient.clear();
            resetAuth();
            resetHousehold();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="h3" style={styles.pageTitle}>Paramètres</Text>

        {/* Profile card */}
        <Card style={styles.profileCard} onPress={() => router.push('/(app)/settings/profile')}>
          <Avatar
            name={profile?.full_name}
            avatarUrl={profile?.avatar_url}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text variant="h4">{profile?.full_name ?? 'Mon profil'}</Text>
            <Text variant="bodySmall" color="secondary">{profile?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Card>

        {/* Foyer */}
        <Card style={styles.section}>
          <Text variant="overline" color="muted" style={styles.sectionTitle}>Foyer</Text>
          <SettingsRow
            icon="home-outline"
            label="Mon foyer"
            iconBg={Colors.mint + '25'}
            onPress={() => router.push('/(app)/settings/household')}
            badge={currentHousehold?.name}
          />
          <Divider />
          <SettingsRow
            icon="people-outline"
            label="Membres"
            iconBg={Colors.blue + '25'}
            onPress={() => router.push('/(app)/settings/household')}
          />
        </Card>

        {/* App */}
        <Card style={styles.section}>
          <Text variant="overline" color="muted" style={styles.sectionTitle}>Application</Text>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            iconBg={Colors.coral + '25'}
            onPress={() => router.push('/(app)/settings/notifications')}
          />
          <Divider />
          <SettingsRow
            icon="shield-outline"
            label="Sécurité"
            iconBg={Colors.lavender + '25'}
            onPress={() => router.push('/(app)/settings/security')}
          />
        </Card>

        {/* Help & Legal */}
        <Card style={styles.section}>
          <Text variant="overline" color="muted" style={styles.sectionTitle}>Aide & Légal</Text>
          <SettingsRow
            icon="help-circle-outline"
            label="Centre d'aide"
            iconBg={Colors.mint + '25'}
            onPress={() => router.push('/(app)/settings/help')}
          />
          <Divider />
          <SettingsRow
            icon="mail-outline"
            label="Nous contacter"
            iconBg={Colors.blue + '25'}
            onPress={() => router.push('/(app)/settings/contact')}
          />
          <Divider />
          <SettingsRow
            icon="document-text-outline"
            label="Conditions d'utilisation"
            iconBg={Colors.gray100}
            onPress={() => router.push('/(app)/settings/terms')}
          />
          <Divider />
          <SettingsRow
            icon="lock-closed-outline"
            label="Politique de confidentialité"
            iconBg={Colors.gray100}
            onPress={() => router.push('/(app)/settings/privacy')}
          />
        </Card>

        {/* Logout */}
        <Card style={styles.section}>
          <SettingsRow
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleSignOut}
            danger
          />
        </Card>

        <Text variant="caption" color="muted" style={styles.version}>
          Keurzen v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  pageTitle: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  profileInfo: { flex: 1, gap: 2 },
  section: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.base,
    minHeight: 52,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  badge: {
    backgroundColor: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: 120,
  },
  version: {
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
