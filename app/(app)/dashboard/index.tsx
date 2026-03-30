import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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
import { Colors, Spacing, BorderRadius, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Mascot } from '../../../src/components/ui/Mascot';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { data: household, isLoading, refetch, isRefetching } = useMyHousehold();
  const { data: allTasks = [] } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers, isLoading: balanceLoading } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const activeTasks = allTasks.filter((t) => t.status !== 'done');
  const doneTasks = allTasks.filter((t) => t.status === 'done');

  const greeting = profile?.full_name
    ? `Bonjour, ${profile.full_name.split(' ')[0]}`
    : 'Bonjour';

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
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
            tintColor={Colors.mint}
            colors={[Colors.mint]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="h2">{greeting}</Text>
            <Text variant="bodySmall" color="secondary">
              {household.name}
            </Text>
          </View>
          <Mascot size={44} expression="happy" />
        </View>

        {/* Quick stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Aujourd'hui"
            value={todayTasks.length.toString()}
            icon="today-outline"
            color={Colors.mint}
            onPress={() => router.push('/(app)/tasks')}
          />
          <StatCard
            label="En retard"
            value={overdueTasks.length.toString()}
            icon="warning-outline"
            color={overdueTasks.length > 0 ? Colors.coral : Colors.gray300}
            onPress={() => router.push('/(app)/tasks')}
          />
          <StatCard
            label="Total actif"
            value={activeTasks.length.toString()}
            icon="list-outline"
            color={Colors.blue}
            onPress={() => router.push('/(app)/tasks')}
          />
        </View>

        {/* Overdue alert */}
        {overdueTasks.length > 0 && (
          <Card
            onPress={() => router.push('/(app)/tasks')}
            style={styles.alertCard}
          >
            <View style={styles.alertRow}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color={Colors.coral} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label">
                  {overdueTasks.length} tache{overdueTasks.length > 1 ? 's' : ''} en retard
                </Text>
                <Text variant="caption" color="muted">
                  {overdueTasks.slice(0, 2).map((t) => t.title).join(', ')}
                  {overdueTasks.length > 2 ? '...' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </Card>
        )}

        {/* Weekly balance */}
        <Text variant="overline" color="muted" style={styles.sectionLabel}>
          Repartition cette semaine
        </Text>
        {balanceMembers.length > 0 ? (
          <Card padding="md">
            {balanceMembers.map((m, i) => (
              <View key={m.userId}>
                <View style={styles.memberRow}>
                  <Avatar name={m.name} avatarUrl={m.avatarUrl} size="sm" color={m.color} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" weight="medium">{m.name}</Text>
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
                  <View style={styles.shareInfo}>
                    <Text variant="label">{Math.round(m.tasksShare * 100)}%</Text>
                    <Badge label="" alertLevel={m.level} size="sm" dot />
                  </View>
                </View>
                {i < balanceMembers.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        ) : (
          <Card padding="md">
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              Pas encore de donnees cette semaine
            </Text>
          </Card>
        )}

        {/* TLX score */}
        <Text variant="overline" color="muted" style={styles.sectionLabel}>
          Charge mentale
        </Text>
        <Card
          padding="md"
          onPress={() => router.push('/(app)/dashboard/tlx')}
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
                {!currentTlx && (
                  <Text variant="bodySmall" color="muted">
                    Bilan non rempli cette semaine
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          ) : (
            <View style={styles.tlxRow}>
              <Ionicons name="pulse-outline" size={28} color={Colors.lavender} />
              <View style={{ flex: 1 }}>
                <Text variant="label">Evaluez votre charge mentale</Text>
                <Text variant="bodySmall" color="muted">
                  Remplissez le questionnaire TLX cette semaine
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          )}
        </Card>

        {/* Completed this week */}
        <Text variant="overline" color="muted" style={styles.sectionLabel}>
          Termine recemment
        </Text>
        <Card padding="md">
          {doneTasks.length > 0 ? (
            <View style={styles.doneList}>
              {doneTasks.slice(0, 5).map((t) => (
                <View key={t.id} style={styles.doneItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.mint} />
                  <Text variant="bodySmall" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                    {t.title}
                  </Text>
                  {t.completed_at && (
                    <Text variant="caption" color="muted">
                      {dayjs(t.completed_at).format('DD/MM')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              Aucune tache terminee cette semaine
            </Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tlxColor(score: number): string {
  if (score <= 33) return Colors.mint;
  if (score <= 66) return Colors.lavender;
  return Colors.coral;
}

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
    <Card onPress={onPress} padding="sm" style={styles.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text variant="h3" style={{ color }}>{value}</Text>
      <Text variant="caption" color="muted" numberOfLines={1}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
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
  },
  alertCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.coral + '08',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.coral + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
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
  shareInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  tlxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tlxCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneList: {
    gap: Spacing.sm,
  },
  doneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
