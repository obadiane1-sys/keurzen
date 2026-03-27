import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskById, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { Loader } from '../../../src/components/ui/Loader';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase/client';
import { useAuthStore } from '../../../src/stores/auth.store';
import type { TaskStatus } from '../../../src/types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const STATUS_OPTIONS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'À faire', value: 'todo', color: Colors.blue },
  { label: 'En cours', value: 'in_progress', color: Colors.lavender },
  { label: 'Terminé', value: 'done', color: Colors.mint },
];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useUiStore();
  const { user } = useAuthStore();
  const { members } = useHouseholdStore();
  const [logMinutes, setLogMinutes] = useState('');
  const [loggingTime, setLoggingTime] = useState(false);

  const { data: task, isLoading } = useTaskById(id);
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  if (isLoading) return <Loader fullScreen />;
  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text variant="body" color="secondary" style={{ textAlign: 'center', padding: Spacing.xl }}>
          Tâche introuvable
        </Text>
      </SafeAreaView>
    );
  }

  const memberColor = members.find((m) => m.user_id === task.assigned_to)?.color;
  const isOverdue =
    task.status !== 'done' &&
    task.due_date &&
    dayjs(task.due_date).isBefore(dayjs(), 'day');

  const effectiveStatus: TaskStatus = isOverdue && task.status !== 'done' ? 'overdue' : (task.status as TaskStatus);
  const totalLoggedMinutes = (task.time_logs ?? []).reduce((sum, l) => sum + l.minutes, 0);

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la tâche',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTask.mutateAsync(task.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleLogTime = async () => {
    const mins = parseInt(logMinutes);
    if (!mins || mins <= 0) {
      showToast('Entrez un nombre de minutes valide', 'error');
      return;
    }

    setLoggingTime(true);
    try {
      const { error } = await supabase.from('time_logs').insert({
        task_id: task.id,
        user_id: user!.id,
        household_id: task.household_id,
        minutes: mins,
        logged_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      showToast(`${mins} minutes enregistrées !`, 'success');
      setLogMinutes('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setLoggingTime(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navigation */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Title & status */}
        <View style={styles.titleRow}>
          <Text variant="h3" style={{ flex: 1 }}>{task.title}</Text>
          <Badge label="" status={effectiveStatus} dot />
        </View>

        {task.description && (
          <Text variant="body" color="secondary" style={styles.description}>
            {task.description}
          </Text>
        )}

        {/* Meta grid */}
        <Card>
          <View style={styles.metaGrid}>
            {task.assigned_profile && (
              <View style={styles.metaItem}>
                <Text variant="overline" color="muted">Assigné à</Text>
                <View style={styles.metaValue}>
                  <Avatar
                    name={task.assigned_profile.full_name}
                    avatarUrl={task.assigned_profile.avatar_url}
                    color={memberColor}
                    size="xs"
                  />
                  <Text variant="label">
                    {task.assigned_profile.full_name}
                  </Text>
                </View>
              </View>
            )}

            {task.due_date && (
              <View style={styles.metaItem}>
                <Text variant="overline" color="muted">Échéance</Text>
                <Text variant="label" style={{ color: isOverdue ? Colors.error : Colors.textPrimary }}>
                  {dayjs(task.due_date).format('D MMMM YYYY')}
                  {isOverdue && ' ⚠'}
                </Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Text variant="overline" color="muted">Priorité</Text>
              <Badge label={task.priority} priority={task.priority as any} />
            </View>

            {task.estimated_minutes && (
              <View style={styles.metaItem}>
                <Text variant="overline" color="muted">Estimation</Text>
                <Text variant="label">{task.estimated_minutes} min</Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Text variant="overline" color="muted">Catégorie</Text>
              <Text variant="label">{task.category}</Text>
            </View>

            {task.recurrence !== 'none' && (
              <View style={styles.metaItem}>
                <Text variant="overline" color="muted">Récurrence</Text>
                <Text variant="label">{task.recurrence}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Status change */}
        <Card>
          <Text variant="h4" style={{ marginBottom: Spacing.sm }}>Changer le statut</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => updateStatus.mutate({ id: task.id, status: opt.value })}
                style={[
                  styles.statusBtn,
                  task.status === opt.value && {
                    backgroundColor: opt.color + '20',
                    borderColor: opt.color,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: task.status === opt.value ? opt.color : Colors.textMuted,
                    fontWeight: task.status === opt.value ? '700' : '400',
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Time tracking */}
        <Card>
          <View style={styles.timeHeader}>
            <Text variant="h4">Temps passé</Text>
            <Text variant="label" color="mint">{totalLoggedMinutes} min total</Text>
          </View>

          {task.estimated_minutes && totalLoggedMinutes > 0 && (
            <View style={styles.timeBar}>
              <View
                style={[
                  styles.timeBarFill,
                  {
                    width: `${Math.min((totalLoggedMinutes / task.estimated_minutes) * 100, 100)}%`,
                    backgroundColor: totalLoggedMinutes > task.estimated_minutes ? Colors.coral : Colors.mint,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.logRow}>
            <TextInput
              style={styles.logInput}
              placeholder="Ajouter des minutes..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={logMinutes}
              onChangeText={setLogMinutes}
            />
            <Button
              label="Ajouter"
              variant="secondary"
              size="sm"
              onPress={handleLogTime}
              isLoading={loggingTime}
            />
          </View>

          {/* Time logs list */}
          {(task.time_logs ?? []).slice(0, 5).map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text variant="caption" color="muted">
                {log.minutes} min • {dayjs(log.logged_at).format('D MMM HH:mm')}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
  },
  backBtn: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  description: {
    lineHeight: 22,
  },
  metaGrid: {
    gap: Spacing.base,
  },
  metaItem: {
    gap: 4,
  },
  metaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeBar: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  timeBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  logRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  logItem: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});
