import React, { useEffect, useRef, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks, useOverdueTasks, useTodayTasks } from '../../../src/lib/queries/tasks';
import { useWeeklyBalance } from '../../../src/lib/queries/weekly-stats';
import { useCurrentTlx, useTlxDelta } from '../../../src/lib/queries/tlx';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { StatusPill } from '../../../src/components/dashboard/StatusPill';
import { NarrativeCard } from '../../../src/components/dashboard/NarrativeCard';
import { TlxDetailCard } from '../../../src/components/dashboard/TlxDetailCard';
import { WeeklyReportCard } from '../../../src/components/dashboard/WeeklyReportCard';
import { HouseholdScoreCard } from '../../../src/components/dashboard/HouseholdScoreCard';
import { WeeklyTipCard } from '../../../src/components/dashboard/WeeklyTipCard';

// ─── Staggered fade-in ──────────────────────────────────────────────────────

function useStaggeredFadeIn(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
    })),
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 450,
          delay: i * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 450,
          delay: i * 50,
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const priorityColors: Record<string, string> = {
  high: Colors.rose,
  urgent: Colors.rose,
  medium: Colors.miel,
  low: Colors.sauge,
};

function formatDateHeader(): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  const now = new Date();
  return `Aujourd'hui, ${now.getDate()} ${months[now.getMonth()]}`;
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: allTasks = [] } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const fadeAnims = useStaggeredFadeIn(10);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // Redirect to onboarding if not seen
  if (profile && !profile.has_seen_onboarding) {
    return <Redirect href="/(app)/onboarding/setup" />;
  }

  const doneTasks = useMemo(() => {
    return allTasks.filter((t) => t.status === 'done');
  }, [allTasks]);

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
        {/* ── 1. HEADER ── */}
        <FadeSection anim={fadeAnims[0]} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="h4" weight="bold" style={styles.dateText}>
              {formatDateHeader()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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

        {/* ── 2. STATUS PILLS ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.pillsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
          >
            <StatusPill dot={Colors.sauge} label={household.name} />
            <StatusPill
              icon={<Ionicons name="clipboard-outline" size={14} color={Colors.textSecondary} />}
              label={`${todayTasks.length} tache${todayTasks.length !== 1 ? 's' : ''} aujourd'hui`}
            />
            {overdueTasks.length > 0 && (
              <StatusPill
                dot={Colors.rose}
                label={`${overdueTasks.length} en retard`}
                variant="alert"
              />
            )}
          </ScrollView>
        </FadeSection>

        {/* ── 3. HOUSEHOLD SCORE ── */}
        <FadeSection anim={fadeAnims[2]} style={styles.sectionPadded}>
          <HouseholdScoreCard />
        </FadeSection>

        {/* ── 3b. WEEKLY TIP ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.sectionPadded}>
          <WeeklyTipCard />
        </FadeSection>

        {/* ── 4. NARRATIVE CARD ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.sectionPadded}>
          <NarrativeCard
            doneTasks={doneTasks.length}
            overdueTasks={overdueTasks.length}
            tlxDelta={tlxDelta?.delta ?? null}
            hasTlx={!!currentTlx}
          />
        </FadeSection>

        {/* ── 5. CHARGE MENTALE ── */}
        <FadeSection anim={fadeAnims[5]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Charge mentale
          </Text>
          <TlxDetailCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
        </FadeSection>

        {/* ── 6. TACHES DU JOUR ── */}
        <FadeSection anim={fadeAnims[6]} style={styles.sectionPadded}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="overline" color="muted">Taches du jour</Text>
            {todayTasks.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text variant="caption" style={{ color: Colors.terracotta }}>Tout voir</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.flatCard}>
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 4).map((t, i) => (
                <View key={t.id}>
                  <View style={styles.taskRow}>
                    <View style={[styles.prioDot, { backgroundColor: priorityColors[t.priority] || priorityColors.medium }]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" weight="semibold" numberOfLines={1}>{t.title}</Text>
                      <Text variant="caption" color="muted">
                        {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                      </Text>
                    </View>
                  </View>
                  {i < Math.min(todayTasks.length, 4) - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Aucune tache prevue aujourd'hui
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 7. REPARTITION SEMAINE ── */}
        <FadeSection anim={fadeAnims[7]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Repartition cette semaine
          </Text>
          <View style={styles.flatCard}>
            {balanceMembers.length > 0 ? (
              balanceMembers.map((m, i) => (
                <View key={m.userId}>
                  <View style={styles.memberRow}>
                    <View style={[styles.memberDot, { backgroundColor: m.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" weight="semibold">{m.name.split(' ')[0]}</Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              width: `${Math.round(m.tasksShare * 100)}%`,
                              backgroundColor: m.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text variant="label" weight="bold" style={styles.percentLabel}>
                      {Math.round(m.tasksShare * 100)}%
                    </Text>
                  </View>
                  {i < balanceMembers.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Pas encore de donnees cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 8. TERMINE RECEMMENT ── */}
        <FadeSection anim={fadeAnims[8]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Termine recemment
          </Text>
          <View style={styles.flatCard}>
            {doneTasks.length > 0 ? (
              doneTasks.slice(0, 5).map((t, i) => (
                <View key={t.id}>
                  <View style={styles.doneItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.sauge} />
                    <Text variant="bodySmall" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                      {t.title}
                    </Text>
                    {t.completed_at && (
                      <Text variant="caption" color="muted">
                        {dayjs(t.completed_at).format('DD/MM')}
                      </Text>
                    )}
                  </View>
                  {i < Math.min(doneTasks.length, 5) - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={styles.emptyText}>
                Aucune tache terminee cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── 9. RAPPORT HEBDO ── */}
        <FadeSection anim={fadeAnims[9]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Rapport de la semaine
          </Text>
          <WeeklyReportCard />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  dateText: {
    color: Colors.textPrimary,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textInverse,
  },

  // Pills
  pillsRow: {
    marginBottom: Spacing.lg,
  },
  pillsContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },

  // Sections
  sectionPadded: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  // Flat card
  flatCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.card,
  },

  // Tasks
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },

  // Balance
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  percentLabel: {
    minWidth: 36,
    textAlign: 'right',
  },

  // Done
  doneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  // Shared
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
