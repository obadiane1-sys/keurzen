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
import { Colors, Spacing, Shadows, Typography } from '../../../src/constants/tokens';
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
  const { data: insights = [] } = useCoachingInsights(household?.id);

  const fadeAnims = useStaggeredFadeIn(5); // header + 4 sections

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
          action={{
            label: 'Creer un foyer',
            onPress: () => router.navigate('/(app)/settings/household'),
          }}
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
          <View style={styles.headerLeft}>
            <View style={styles.mascotCircle}>
              <Mascot size={36} expression="calm" />
            </View>
            <View>
              <Text variant="h2" weight="bold" style={styles.greeting}>
                Bonjour, <Text style={styles.firstNameAccent}>{firstName}</Text>
              </Text>
              <Text variant="bodySmall" color="muted">
                Prete a equilibrer votre quotidien ?
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/notifications')}
            style={styles.bellButton}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </FadeSection>

        {/* ── 1. INSIGHTS CAROUSEL ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.section}>
          <InsightsCarousel insights={insights} />
        </FadeSection>

        {/* ── 2. SCORE DU FOYER ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.sectionPadded}>
          <ScoreHeroCard />
        </FadeSection>

        {/* ── 3. GRID: Equity + Mental Load ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.sectionPadded}>
          <View style={styles.gridRow}>
            <TaskEquityCard />
            <View style={{ width: Spacing.base }} />
            <MentalLoadCardV2 />
          </View>
        </FadeSection>

        {/* ── 4. UPCOMING TASKS ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.sectionPadded}>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  mascotCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
  },
  firstNameAccent: {
    color: Colors.terracotta,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionPadded: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
  },
});
