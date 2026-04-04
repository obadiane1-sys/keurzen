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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../src/hooks/useAuth';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { useTasks, useOverdueTasks, useTodayTasks } from '../../../src/lib/queries/tasks';
import { useWeeklyBalance } from '../../../src/lib/queries/weekly-stats';
import { useCurrentTlx, useTlxDelta } from '../../../src/lib/queries/tlx';
import { useUnreadCount } from '../../../src/lib/queries/notifications';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { WeeklyReportCard } from '../../../src/components/dashboard/WeeklyReportCard';

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

/** TLX Score color: 0-33 sauge (light), 34-66 prune (medium), 67-100 rose (heavy) */
function tlxColor(score: number): string {
  if (score <= 33) return Colors.sauge;
  if (score <= 66) return Colors.prune;
  return Colors.rose;
}

function mapPriority(p: string): 'high' | 'medium' | 'low' {
  if (p === 'high') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
}

const priorityColors: Record<string, string> = {
  high: Colors.rose,
  medium: Colors.miel,
  low: Colors.sauge,
};

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
  const { data: unreadCount = 0 } = useUnreadCount();

  const fadeAnims = useStaggeredFadeIn(8);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const greeting = getGreeting();

  const activeTasks = allTasks.filter((t) => t.status !== 'done');
  const doneTasks = allTasks.filter((t) => t.status === 'done');

  if (isLoading) return <Loader fullScreen />;

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyHeader}>
          <Text variant="h2">{greeting}</Text>
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
          <View style={styles.headerLeft}>
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
            <View>
              <Text variant="h3" weight="bold" style={styles.greetingText}>
                {greeting}, {firstName}
              </Text>
              <Text variant="caption" style={styles.householdText} numberOfLines={1}>
                {household.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/notifications')}
            style={styles.bellBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeSection>

        {/* ── QUICK STATS ── */}
        <FadeSection anim={fadeAnims[1]} style={styles.statsRow}>
          <StatCard
            label="Aujourd'hui"
            value={todayTasks.length.toString()}
            icon="today-outline"
            color={Colors.sauge}
            onPress={() => router.push('/(app)/tasks')}
          />
          <StatCard
            label="En retard"
            value={overdueTasks.length.toString()}
            icon="warning-outline"
            color={overdueTasks.length > 0 ? Colors.rose : Colors.gray300}
            onPress={() => router.push('/(app)/tasks')}
          />
          <StatCard
            label="Total actif"
            value={activeTasks.length.toString()}
            icon="list-outline"
            color={Colors.miel}
            onPress={() => router.push('/(app)/tasks')}
          />
        </FadeSection>

        {/* ── OVERDUE ALERT ── */}
        {overdueTasks.length > 0 && (
          <FadeSection anim={fadeAnims[2]} style={styles.sectionPadded}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => router.push('/(app)/tasks')}
              activeOpacity={0.85}
            >
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color={Colors.rose} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label">
                  {overdueTasks.length} tache{overdueTasks.length > 1 ? 's' : ''} en retard
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {overdueTasks.slice(0, 2).map((t) => t.title).join(', ')}
                  {overdueTasks.length > 2 ? '...' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </FadeSection>
        )}

        {/* ── WEEKLY BALANCE ── */}
        <FadeSection anim={fadeAnims[3]} style={styles.sectionPadded}>
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
                      <Text variant="bodySmall" weight="medium">{m.name.split(' ')[0]}</Text>
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
                    <Text variant="label" style={{ minWidth: 36, textAlign: 'right' }}>
                      {Math.round(m.tasksShare * 100)}%
                    </Text>
                  </View>
                  {i < balanceMembers.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text variant="body" color="muted" style={{ textAlign: 'center', paddingVertical: Spacing.md }}>
                Pas encore de donnees cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── TLX CARD ── */}
        <FadeSection anim={fadeAnims[4]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Charge mentale
          </Text>
          <TouchableOpacity
            style={styles.flatCard}
            onPress={() => router.push('/(app)/dashboard/tlx')}
            activeOpacity={0.85}
          >
            {currentTlx ? (
              <View style={styles.tlxRow}>
                <View style={[styles.tlxCircle, { borderColor: tlxColor(currentTlx.score) }]}>
                  <Text variant="h3" style={{ color: tlxColor(currentTlx.score) }}>
                    {currentTlx.score}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label">Score TLX</Text>
                  {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
                    <Text
                      variant="bodySmall"
                      color={tlxDelta.delta > 0 ? 'coral' : 'mint'}
                    >
                      {tlxDelta.delta > 0 ? '+' : ''}{tlxDelta.delta} vs semaine derniere
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            ) : (
              <View style={styles.tlxRow}>
                <Ionicons name="pulse-outline" size={28} color={Colors.prune} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">Evaluez votre charge mentale</Text>
                  <Text variant="bodySmall" color="muted">
                    Remplissez le questionnaire TLX
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </FadeSection>

        {/* ── TODAY'S TASKS ── */}
        {todayTasks.length > 0 && (
          <FadeSection anim={fadeAnims[5]} style={styles.sectionPadded}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="overline" color="muted">Taches du jour</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/tasks')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text variant="caption" style={{ color: Colors.terracotta }}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.flatCard}>
              {todayTasks.slice(0, 4).map((t, i) => {
                const prio = mapPriority(t.priority);
                return (
                  <View key={t.id}>
                    <View style={styles.taskRow}>
                      <View style={[styles.prioDot, { backgroundColor: priorityColors[prio] }]} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodySmall" weight="medium" numberOfLines={1}>{t.title}</Text>
                        <Text variant="caption" color="muted">
                          {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                        </Text>
                      </View>
                    </View>
                    {i < Math.min(todayTasks.length, 4) - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </FadeSection>
        )}

        {/* ── RECENTLY DONE ── */}
        <FadeSection anim={fadeAnims[6]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Termine recemment
          </Text>
          <View style={styles.flatCard}>
            {doneTasks.length > 0 ? (
              doneTasks.slice(0, 5).map((t, i) => (
                <View key={t.id}>
                  <View style={styles.doneItem}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.sauge} />
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
              <Text variant="body" color="muted" style={{ textAlign: 'center', paddingVertical: Spacing.md }}>
                Aucune tache terminee cette semaine
              </Text>
            )}
          </View>
        </FadeSection>

        {/* ── WEEKLY REPORT ── */}
        <FadeSection anim={fadeAnims[7]} style={styles.sectionPadded}>
          <Text variant="overline" color="muted" style={styles.sectionLabel}>
            Rapport de la semaine
          </Text>
          <WeeklyReportCard />
        </FadeSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={20} color={color} />
      <Text variant="h3" style={{ color }}>{value}</Text>
      <Text variant="caption" color="muted" numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
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
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textInverse,
  },
  greetingText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.xl * 1.2,
  },
  householdText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bellBtn: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textInverse,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },

  // Sections
  sectionPadded: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
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
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    ...Shadows.card,
  },

  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.rose + '08',
    borderWidth: 1.5,
    borderColor: Colors.rose + '30',
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.rose + '18',
    alignItems: 'center',
    justifyContent: 'center',
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
  },

  // TLX
  tlxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tlxCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Done
  doneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
});
