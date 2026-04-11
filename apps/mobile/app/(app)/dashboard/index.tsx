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
import { Spacing, Typography } from '../../../src/constants/tokens';
import { ColorsV2 } from '../../../src/constants/tokensV2';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { InsightsCarousel } from '../../../src/components/dashboard/InsightsCarousel';
import { ScoreHeroCard } from '../../../src/components/dashboard/ScoreHeroCard';
import { TaskEquityCard } from '../../../src/components/dashboard/TaskEquityCard';
import { MentalLoadCardV2 } from '../../../src/components/dashboard/MentalLoadCardV2';
import { UpcomingTasksCard } from '../../../src/components/dashboard/UpcomingTasksCard';
import { HomeHeartCard } from '../../../src/components/dashboard/HomeHeartCard';

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

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: insights = [] } = useCoachingInsights();

  const fadeAnims = useStaggeredFadeIn(7);

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
            tintColor={ColorsV2.primary}
            colors={[ColorsV2.primary]}
          />
        }
      >
        {/* HEADER */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={styles.greetingColumn}>
            <Text variant="overline" style={styles.greetingOverline}>
              Bonjour
            </Text>
            <Text variant="h1" weight="bold" style={styles.greetingName}>
              {firstName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={ColorsV2.onSurfaceVariant} />
          </TouchableOpacity>
        </FadeSection>

        {/* 1. INSIGHTS CAROUSEL */}
        <FadeSection anim={fadeAnims[1]} style={styles.carouselSection}>
          <InsightsCarousel insights={insights} />
        </FadeSection>

        {/* 2. SCORE DU FOYER */}
        <FadeSection anim={fadeAnims[2]} style={styles.section}>
          <ScoreHeroCard />
        </FadeSection>

        {/* 3. GRID: TASK EQUITY + MENTAL LOAD */}
        <FadeSection anim={fadeAnims[3]} style={styles.gridRow}>
          <TaskEquityCard />
          <View style={styles.gridSpacer} />
          <MentalLoadCardV2 />
        </FadeSection>

        {/* 4. UPCOMING TASKS */}
        <FadeSection anim={fadeAnims[4]} style={styles.section}>
          <UpcomingTasksCard />
        </FadeSection>

        {/* 5. HOME HEART */}
        <FadeSection anim={fadeAnims[5]} style={styles.section}>
          <HomeHeartCard />
        </FadeSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ColorsV2.surface,
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
    paddingBottom: Spacing['2xl'],
  },
  greetingColumn: {},
  greetingOverline: {
    fontSize: 11,
    letterSpacing: 2,
    color: ColorsV2.secondary,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: Typography.fontSize['3xl'],
    color: ColorsV2.onSurface,
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ColorsV2.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselSection: {
    marginBottom: Spacing['2xl'],
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  gridSpacer: {
    width: Spacing.md,
  },
});
