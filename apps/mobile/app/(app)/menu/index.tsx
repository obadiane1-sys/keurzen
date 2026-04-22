import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { signOut } from '../../../src/lib/supabase/auth';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { useMessagesUnreadCount } from '../../../src/lib/queries/messaging';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { QuickActionCard } from '../../../src/components/menu/QuickActionCard';
import { MenuSection } from '../../../src/components/menu/MenuSection';
import { MenuRow } from '../../../src/components/menu/MenuRow';

// ─── Staggered fade-in ─────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    })),
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 400,
          delay: i * 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 400,
          delay: i * 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, []);

  return anims;
}

function FadeSection({
  anim,
  style,
  children,
}: {
  anim: { opacity: Animated.Value; translateY: Animated.Value };
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={[
        style,
        { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const router = useRouter();
  const { profile, user } = useCurrentUser();
  const resetAuth = useAuthStore((s) => s.reset);
  const resetHousehold = useHouseholdStore((s) => s.reset);
  const { setPendingInviteToken, setPendingInviteCode } = useUiStore();
  const { data: msgUnreadCount = 0 } = useMessagesUnreadCount();

  const fadeAnims = useStaggeredFadeIn(5);

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata as Record<string, string> | undefined)?.full_name?.trim() ||
    'Utilisateur';

  const firstName = displayName.split(' ')[0];
  const email = profile?.email ?? '';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const doSignOut = async () => {
    setPendingInviteToken(null);
    setPendingInviteCode(null);
    resetHousehold();
    resetAuth();
    router.replace('/(auth)/login');

    try {
      await signOut();
    } catch {
      // Ignore — local state already cleared
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tu vas être déconnecté·e. Continuer ?')) {
        doSignOut();
      }
      return;
    }
    Alert.alert('Se déconnecter', 'Tu vas être déconnecté·e. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: doSignOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.section}>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(app)/settings/profile')}
            activeOpacity={0.85}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="h3" weight="bold" style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text variant="h4" weight="bold" style={{ color: Colors.textPrimary, fontSize: 18 }}>
                {displayName}
              </Text>
              <Text variant="caption" style={{ color: Colors.textSecondary, fontSize: 14 }}>
                {email}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </FadeSection>

        {/* ── Quick Actions ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <View style={styles.quickGrid}>
            <View style={styles.quickRow}>
              <QuickActionCard
                icon="bar-chart-outline"
                label="Analyse"
                color={Colors.prune}
                onPress={() => router.push('/(app)/menu/analysis')}
              />
              <QuickActionCard
                icon="pulse-outline"
                label="Charge mentale"
                color={Colors.rose}
                onPress={() => router.push('/(app)/dashboard/tlx')}
              />
            </View>
            <View style={styles.quickRow}>
              <QuickActionCard
                icon="person-add-outline"
                label="Inviter"
                color={Colors.miel}
                onPress={() => router.push('/(app)/settings/invite')}
              />
              <QuickActionCard
                icon="list-outline"
                label="Listes"
                color={Colors.sauge}
                onPress={() => router.push('/(app)/lists')}
              />
            </View>
          </View>
        </FadeSection>

        {/* ── Foyer ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <MenuSection title="Foyer">
            <MenuRow
              icon="home-outline"
              label="Mon foyer"
              color={Colors.sauge}
              onPress={() => router.push('/(app)/settings/household')}
            />
            <MenuRow
              icon="chatbubbles-outline"
              label={msgUnreadCount > 0 ? `Messages (${msgUnreadCount})` : 'Messages'}
              color={Colors.terracotta}
              onPress={() => router.push('/(app)/messages')}
            />
            <MenuRow
              icon="mail-outline"
              label="Invitations"
              color={Colors.miel}
              onPress={() => router.push('/(app)/settings/invite')}
            />
            <MenuRow
              icon="list-outline"
              label="Listes"
              color={Colors.miel}
              onPress={() => router.push('/(app)/lists')}
            />
            <MenuRow
              icon="restaurant-outline"
              label="Repas"
              color={Colors.terracotta}
              onPress={() => router.push('/(app)/meals')}
            />
            <MenuRow
              icon="bar-chart-outline"
              label="Analyse"
              color={Colors.prune}
              onPress={() => router.push('/(app)/menu/analysis')}
            />
          </MenuSection>
        </FadeSection>

        {/* ── Compte ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.section}>
          <MenuSection title="Compte">
            <MenuRow
              icon="lock-closed-outline"
              label="Securite"
              color={Colors.prune}
              onPress={() => router.push('/(app)/settings/security')}
            />
            <MenuRow
              icon="notifications-outline"
              label="Notifications"
              color={Colors.rose}
              onPress={() => router.push('/(app)/settings/notifications')}
            />
            <MenuRow
              icon="help-circle-outline"
              label="Aide"
              color={Colors.textSecondary}
              onPress={() => router.push('/(app)/settings/help')}
            />
            <MenuRow
              icon="document-text-outline"
              label="Conditions d'utilisation"
              color={Colors.textSecondary}
              onPress={() => router.push('/(app)/settings/cgu')}
            />
            <MenuRow
              icon="shield-checkmark-outline"
              label="Confidentialite"
              color={Colors.textSecondary}
              onPress={() => router.push('/(app)/settings/privacy')}
            />
          </MenuSection>
        </FadeSection>

        {/* ── Footer ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.footer}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text variant="body" weight="semibold" style={{ color: Colors.error, fontSize: 16 }}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
          <Text variant="caption" style={styles.version}>
            Keurzen v{appVersion}
          </Text>
        </FadeSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.base,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: Colors.textInverse,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },

  // Quick actions
  quickGrid: {
    gap: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  version: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
