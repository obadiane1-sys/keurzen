import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { useTasks, useOverdueTasks, useTodayTasks } from '../../../src/lib/queries/tasks';
import { useCurrentTlx, useTlxDelta } from '../../../src/lib/queries/tlx';
import { useCurrentWeekStats, useAlerts } from '../../../src/lib/queries/weekly-stats';
import { useMyHousehold } from '../../../src/lib/queries/household';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { CreateTaskModal } from '../../../src/components/tasks/CreateTaskModal';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import type { Task, WeeklyStat } from '../../../src/types';

dayjs.locale('fr');

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashboardHeader() {
  const { profile } = useAuthStore();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi';
  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <View style={styles.header}>
      <View>
        <Text variant="overline" color="muted">
          {dayjs().format('dddd D MMMM')}
        </Text>
        <Text variant="h3">
          {greeting}, {firstName} 👋
        </Text>
      </View>
      <Avatar
        name={profile?.full_name}
        avatarUrl={profile?.avatar_url}
        size="md"
      />
    </View>
  );
}

function KpiRow() {
  const todayTasks = useTodayTasks();
  const overdue = useOverdueTasks();
  const { data: tasks = [] } = useTasks();
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <View style={styles.kpiRow}>
      <Card style={styles.kpiCard} padding="sm">
        <Text variant="h2" color="mint">{todayTasks.length}</Text>
        <Text variant="caption" color="secondary">{"Aujourd'hui"}</Text>
      </Card>
      <Card style={styles.kpiCard} padding="sm">
        <Text variant="h2" color="coral">{overdue.length}</Text>
        <Text variant="caption" color="secondary">En retard</Text>
      </Card>
      <Card style={styles.kpiCard} padding="sm">
        <Text variant="h2" style={{ color: Colors.lavender }}>{doneTasks.length}</Text>
        <Text variant="caption" color="secondary">Terminées</Text>
      </Card>
    </View>
  );
}

function TlxCard() {
  const { data: currentTlx } = useCurrentTlx();
  const { data: delta } = useTlxDelta();
  const router = useRouter();

  const scoreColor =
    !currentTlx ? Colors.textMuted
    : currentTlx.score <= 30 ? Colors.mint
    : currentTlx.score <= 60 ? Colors.blue
    : currentTlx.score <= 80 ? Colors.coral
    : Colors.error;

  return (
    <Card style={styles.tlxCard} onPress={() => router.push('/(app)/dashboard/tlx')}>
      <View style={styles.tlxHeader}>
        <Text variant="h4">Charge mentale</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>

      {!currentTlx ? (
        <View style={styles.tlxEmpty}>
          <Text variant="bodySmall" color="muted">
            Pas de bilan cette semaine
          </Text>
          <Button
            label="Faire mon bilan"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(app)/dashboard/tlx')}
          />
        </View>
      ) : (
        <View style={styles.tlxContent}>
          <View style={styles.tlxScore}>
            <Text
              variant="display"
              style={{ color: scoreColor, fontSize: 48, fontWeight: '800' }}
            >
              {currentTlx.score}
            </Text>
            <Text variant="body" color="muted">/100</Text>
          </View>

          {delta?.hasComparison && delta.delta !== null && (
            <View style={styles.tlxDelta}>
              <Ionicons
                name={delta.delta > 0 ? 'trending-up' : delta.delta < 0 ? 'trending-down' : 'remove'}
                size={16}
                color={delta.delta > 0 ? Colors.coral : delta.delta < 0 ? Colors.mint : Colors.textMuted}
              />
              <Text
                variant="caption"
                style={{
                  color: delta.delta > 0 ? Colors.coral : delta.delta < 0 ? Colors.mint : Colors.textMuted,
                  fontWeight: '600',
                }}
              >
                {delta.delta > 0 ? '+' : ''}{delta.delta} pts vs semaine dernière
              </Text>
            </View>
          )}

          {delta && !delta.hasComparison && (
            <Text variant="caption" color="muted">
              Première saisie de la semaine
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

function TaskListItem({ task }: { task: Task }) {
  const router = useRouter();
  const isOverdue = task.status === 'overdue' ||
    (task.status !== 'done' && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day'));

  return (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => router.push(`/(app)/tasks/${task.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.taskLeft}>
        <Text variant="label" numberOfLines={1} style={styles.taskTitle}>
          {task.title}
        </Text>
        {task.due_date && (
          <Text variant="caption" color={isOverdue ? 'error' : 'muted'}>
            {isOverdue ? '⚠ ' : ''}{dayjs(task.due_date).format('D MMM')}
          </Text>
        )}
      </View>
      <View style={styles.taskRight}>
        {isOverdue && <Badge label="En retard" status="overdue" size="sm" />}
        {task.assigned_profile && (
          <Avatar
            name={task.assigned_profile.full_name}
            avatarUrl={task.assigned_profile.avatar_url}
            size="xs"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

function WeeklyBalanceCard() {
  const { data: stats = [], isLoading } = useCurrentWeekStats();
  const { members } = useHouseholdStore();

  if (isLoading) return <Loader size="small" />;
  if (stats.length === 0) return null;

  return (
    <Card>
      <Text variant="h4" style={styles.sectionTitle}>
        Équilibre de la semaine
      </Text>
      <View style={styles.balanceList}>
        {stats.map((stat) => {
          const member = members.find((m) => m.user_id === stat.user_id);
          const color = member?.color ?? Colors.mint;
          const share = Math.round(stat.tasks_share * 100);
          const expected = Math.round(stat.expected_share * 100);
          const delta = share - expected;

          return (
            <View key={stat.id} style={styles.balanceRow}>
              <Avatar
                name={stat.profile?.full_name}
                avatarUrl={stat.profile?.avatar_url}
                color={color}
                size="sm"
              />
              <Text variant="label" style={styles.balanceName} numberOfLines={1}>
                {stat.profile?.full_name?.split(' ')[0] ?? 'Membre'}
              </Text>
              <View style={styles.balanceBar}>
                <View
                  style={[
                    styles.balanceFill,
                    {
                      width: `${share}%`,
                      backgroundColor: delta > 20 ? Colors.coral : delta < -20 ? Colors.blue : Colors.mint,
                    },
                  ]}
                />
              </View>
              <Text
                variant="caption"
                style={{
                  color: delta > 20 ? Colors.coral : delta < -20 ? Colors.blue : Colors.textSecondary,
                  minWidth: 36,
                  textAlign: 'right',
                  fontWeight: '600',
                }}
              >
                {share}%
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { taskModalOpen, setTaskModalOpen } = useUiStore();
  const { currentHousehold } = useHouseholdStore();
  const { data: tasks = [], isLoading, refetch } = useTasks();
  const { data: alerts = [] } = useAlerts();
  const [refreshing, setRefreshing] = React.useState(false);

  const { isLoading: isHouseholdLoading } = useMyHousehold();

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'overdue')
    .slice(0, 5);

  const recentDone = tasks
    .filter((t) => t.status === 'done' && t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!currentHousehold && !isHouseholdLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          variant="household"
          onCta={() => router.push('/(app)/settings/household')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.mint} />
        }
      >
        <DashboardHeader />

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card style={[styles.alertCard, { backgroundColor: Colors.coral + '15', borderColor: Colors.coral + '40', borderWidth: 1 }]}>
            <View style={styles.alertRow}>
              <Ionicons name="alert-circle" size={18} color={Colors.coral} />
              <Text variant="bodySmall" style={{ flex: 1 }}>
                {alerts[0].message}
              </Text>
            </View>
          </Card>
        )}

        <KpiRow />

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Button
            label="+ Tâche"
            variant="primary"
            size="md"
            onPress={() => setTaskModalOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            label="Calendrier"
            variant="secondary"
            size="md"
            onPress={() => router.push('/(app)/calendar')}
            style={{ flex: 1 }}
            leftIcon={<Ionicons name="calendar-outline" size={16} color={Colors.navy} />}
          />
        </View>

        <TlxCard />

        <WeeklyBalanceCard />

        {/* Upcoming tasks */}
        {upcomingTasks.length > 0 && (
          <Card>
            <View style={styles.sectionHeader}>
              <Text variant="h4">À venir</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/tasks')}>
                <Text variant="caption" color="mint">Voir tout</Text>
              </TouchableOpacity>
            </View>
            {upcomingTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </Card>
        )}

        {/* Recently done */}
        {recentDone.length > 0 && (
          <Card>
            <Text variant="h4" style={styles.sectionTitle}>Récemment terminées</Text>
            {recentDone.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </Card>
        )}

        {tasks.length === 0 && !isLoading && (
          <EmptyState
            variant="dashboard"
            onCta={() => setTaskModalOpen(true)}
          />
        )}

        {isLoading && <Loader label="Chargement..." />}
      </ScrollView>
      <CreateTaskModal
        visible={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tlxCard: {
    gap: Spacing.sm,
  },
  tlxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tlxEmpty: {
    gap: Spacing.sm,
  },
  tlxContent: {
    gap: Spacing.xs,
  },
  tlxScore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  tlxDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  taskLeft: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    flex: 1,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertCard: {
    borderRadius: BorderRadius.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceList: {
    gap: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceName: {
    width: 60,
  },
  balanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  balanceFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
