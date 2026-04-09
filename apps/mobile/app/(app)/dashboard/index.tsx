import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TlxSummaryCard } from '../../../src/components/dashboard/TlxSummaryCard';
import { TodayTasksCard } from '../../../src/components/dashboard/TodayTasksCard';
import { RepartitionCard } from '../../../src/components/dashboard/RepartitionCard';
import { WeeklyTipCard } from '../../../src/components/dashboard/WeeklyTipCard';

// ─── Staggered fade-in ──────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const animsRef = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
    })),
  );

  useEffect(() => {
    const anims = animsRef.current;
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 450,
          delay: i * 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 450,
          delay: i * 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, []);

  return animsRef.current;
}

function FadeSection({
  anim,
  style,
  children,
}: {
  anim: { opacity: Animated.Value; translateY: Animated.Value };
  style?: object | object[];
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

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();

  const fadeAnims = useStaggeredFadeIn(6); // header + 5 cards

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text variant="h2">Bienvenue</Text>
          <Mascot size={44} expression="calm" />
        </View>
        <EmptyState
          variant="household"
          expression="normal"
          title="Votre foyer vous attend"
          subtitle="Creez un foyer ou rejoignez-en un avec un code d'invitation."
          action={{ label: 'Creer un foyer', onPress: () => router.navigate('/(app)/settings/household') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.terracotta}
            colors={[Colors.terracotta]}
          />
        }
      >
        {/* ── HEADER ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="muted" style={styles.weekLabel}>
              {`SEMAINE DU ${dayjs().startOf('week').format('D MMMM').toUpperCase()}`}
            </Text>
            <Text variant="h2" weight="extrabold" style={styles.title}>
              Tableau de bord
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="body" weight="bold" style={styles.avatarText}>
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. SCORE ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 2. TLX ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <TlxSummaryCard />
        </FadeSection>

        {/* ── 3. TODAY TASKS ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.section}>
          <TodayTasksCard />
        </FadeSection>

        {/* ── 4. REPARTITION ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.section}>
          <RepartitionCard />
        </FadeSection>

        {/* ── 5. CONSEIL ── */}
        <FadeSection anim={fadeAnims[5]} style={styles.section}>
          <WeeklyTipCard />
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
    paddingBottom: Spacing['4xl'],
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  weekLabel: {
    fontSize: Typography.fontSize.xs,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
  },
});
