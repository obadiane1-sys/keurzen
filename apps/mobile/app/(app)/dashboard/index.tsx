import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useCoachingInsights } from '@keurzen/queries';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { InsightsCarousel } from '../../../src/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '../../../src/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '../../../src/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '../../../src/components/dashboard/UpcomingTasksCard';

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
  const { data: insights = [] } = useCoachingInsights();

  const fadeAnims = useStaggeredFadeIn(6); // header + 5 sections

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
          <View style={styles.mascotCircle}>
            <Mascot size={36} />
          </View>
          <View style={styles.greetingColumn}>
            <Text variant="h2" weight="bold">
              {'Bonjour, '}
              <Text variant="h2" weight="bold" style={styles.firstNameAccent}>
                {firstName}
              </Text>
            </Text>
            <Text variant="bodySmall" color="muted">
              Prete a equilibrer votre quotidien ?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. INSIGHTS CAROUSEL ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.carouselSection}>
          <InsightsCarousel insights={insights} />
        </FadeSection>

        {/* ── 2. SCORE DU FOYER ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 3. GRID: TASK EQUITY + MENTAL LOAD ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.gridRow}>
          <TaskEquityCard />
          <View style={styles.gridSpacer} />
          <MentalLoadCardV2 />
        </FadeSection>

        {/* ── 4. UPCOMING TASKS ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.section}>
          <UpcomingTasksCard />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  mascotCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  greetingColumn: {
    flex: 1,
  },
  firstNameAccent: {
    color: Colors.terracotta,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.base,
  },
  carouselSection: {
    marginBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  gridSpacer: {
    width: Spacing.base,
  },
});
