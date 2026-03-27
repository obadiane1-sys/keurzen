import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTasks, useUpdateTaskStatus } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Loader } from '../../../src/components/ui/Loader';
import { Ionicons } from '@expo/vector-icons';
import { CreateTaskModal } from '../../../src/components/tasks/CreateTaskModal';
import type { Task, TaskStatus } from '../../../src/types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterStatus = 'all' | TaskStatus;

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'À faire', value: 'todo' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Terminées', value: 'done' },
  { label: 'En retard', value: 'overdue' },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const updateStatus = useUpdateTaskStatus();
  const { members } = useHouseholdStore();

  const memberColor = members.find((m) => m.user_id === task.assigned_to)?.color;
  const isOverdue =
    task.status !== 'done' &&
    task.due_date &&
    dayjs(task.due_date).isBefore(dayjs(), 'day');

  const effectiveStatus: TaskStatus =
    isOverdue && task.status !== 'done' ? 'overdue' : (task.status as TaskStatus);

  const toggleDone = async () => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    await updateStatus.mutateAsync({ id: task.id, status: newStatus });
  };

  return (
    <Card
      style={styles.taskCard}
      onPress={() => router.push(`/(app)/tasks/${task.id}`)}
      padding="sm"
    >
      <View style={styles.taskCardContent}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={toggleDone}
          style={[
            styles.checkbox,
            task.status === 'done' && { backgroundColor: Colors.mint, borderColor: Colors.mint },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {task.status === 'done' && (
            <Ionicons name="checkmark" size={14} color="white" />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.taskCardBody}>
          <View style={styles.taskCardRow}>
            <Text
              variant="label"
              numberOfLines={1}
              style={[
                styles.taskCardTitle,
                task.status === 'done' && styles.taskCardTitleDone,
              ]}
            >
              {task.title}
            </Text>
            {isOverdue && (
              <Badge label="En retard" status="overdue" size="sm" />
            )}
          </View>

          <View style={styles.taskCardMeta}>
            {task.due_date && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={isOverdue ? Colors.error : Colors.textMuted}
                />
                <Text
                  variant="caption"
                  style={{ color: isOverdue ? Colors.error : Colors.textMuted }}
                >
                  {dayjs(task.due_date).format('D MMM')}
                </Text>
              </View>
            )}

            {task.estimated_minutes && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                <Text variant="caption" color="muted">{task.estimated_minutes}min</Text>
              </View>
            )}

            <Badge
              label=""
              priority={task.priority as any}
              size="sm"
              dot
            />
          </View>
        </View>

        {/* Assignee */}
        {task.assigned_profile && (
          <Avatar
            name={task.assigned_profile.full_name}
            avatarUrl={task.assigned_profile.avatar_url}
            color={memberColor}
            size="sm"
          />
        )}
      </View>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const { data: tasks = [], isLoading, refetch } = useTasks();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const isOverdue =
      task.status !== 'done' &&
      task.due_date &&
      dayjs(task.due_date).isBefore(dayjs(), 'day');

    const effectiveStatus = isOverdue ? 'overdue' : task.status;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') return isOverdue;
    return effectiveStatus === filterStatus;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3">Tâches</Text>
        <Button
          label="+ Nouvelle"
          variant="primary"
          size="sm"
          onPress={() => setShowCreateModal(true)}
        />
      </View>

      {/* Filters */}
      <View>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterStatus(item.value)}
              style={[
                styles.filterChip,
                filterStatus === item.value && styles.filterChipActive,
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  fontWeight: filterStatus === item.value ? '600' : '400',
                  color: filterStatus === item.value ? Colors.coral : Colors.textSecondary,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Task list */}
      {isLoading ? (
        <Loader label="Chargement des tâches..." />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          variant="tasks"
          onCta={() => setShowCreateModal(true)}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.mint} />
          }
          renderItem={({ item }) => <TaskCard task={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      <CreateTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.coral + '15',
    borderColor: Colors.coral + '60',
  },
  taskList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  taskCard: {
    borderRadius: BorderRadius.lg,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCardBody: {
    flex: 1,
    gap: 4,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskCardTitle: {
    flex: 1,
  },
  taskCardTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
