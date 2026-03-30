import React, { useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import {
  useTaskById,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '../../../src/lib/queries/tasks';
import { useHouseholdStore } from '../../../src/stores/household.store';
import { taskSchema } from '../../../src/utils/validation';
import { categoryLabels, priorityLabels } from '../../../src/components/tasks/TaskCard';
import type { TaskFormValues, TaskStatus } from '../../../src/types';

// ─── Zone labels ─────────────────────────────────────────────────────────────

const zoneLabels: Record<string, string> = {
  kitchen: 'Cuisine',
  bathroom: 'Salle de bain',
  bedroom: 'Chambre',
  living_room: 'Salon',
  garden: 'Jardin',
  garage: 'Garage',
  general: 'Général',
  outside: 'Extérieur',
  other: 'Autre',
};

const recurrenceLabels: Record<string, string> = {
  none: 'Aucune',
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuelle',
  monthly: 'Mensuelle',
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members } = useHouseholdStore();

  const { data: task, isLoading } = useTaskById(id ?? '');
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [isEditing, setIsEditing] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });

  // Reset form when task loads
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        category: task.category,
        zone: task.zone,
        priority: task.priority,
        recurrence: task.recurrence,
        assigned_to: task.assigned_to ?? '',
        due_date: task.due_date ?? '',
        estimated_minutes: task.estimated_minutes ?? undefined,
      });
    }
  }, [task, reset]);

  if (isLoading || !task) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  const isDone = task.status === 'done';
  const isOverdue =
    !isDone && task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
  const displayStatus = isOverdue ? 'overdue' : task.status;
  const cat = categoryLabels[task.category] ?? categoryLabels.other;

  const assignee = members.find((m) => m.user_id === task.assigned_to);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleStatus = () => {
    const newStatus: TaskStatus = isDone ? 'todo' : 'done';
    updateStatus.mutate({ id: task.id, status: newStatus });
  };

  const handleDelete = () => {
    const doDelete = () => {
      deleteTask.mutate(task.id, {
        onSuccess: () => router.back(),
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette tâche ?')) doDelete();
    } else {
      Alert.alert('Supprimer', 'Supprimer cette tâche ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const onSave = async (values: TaskFormValues) => {
    try {
      await updateTask.mutateAsync({ id: task.id, updates: values });
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  // ─── Edit mode ───────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Modifier la tâche"
          onBack={() => {
            reset();
            setIsEditing(false);
          }}
        />
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Titre"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            )}
          />
          <Controller
            control={control}
            name="due_date"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date d'échéance"
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
                onChangeText={onChange}
                leftIcon="calendar-outline"
              />
            )}
          />
          <Controller
            control={control}
            name="estimated_minutes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Durée estimée (minutes)"
                value={value?.toString() ?? ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  onChange(isNaN(num) ? undefined : num);
                }}
                keyboardType="numeric"
                leftIcon="time-outline"
              />
            )}
          />

          <View style={styles.editActions}>
            <Button
              label="Enregistrer"
              onPress={handleSubmit(onSave)}
              isLoading={updateTask.isPending}
              fullWidth
            />
            <Button
              label="Annuler"
              variant="ghost"
              onPress={() => {
                reset();
                setIsEditing(false);
              }}
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Detail view ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Détail"
        rightAction={
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + Status */}
        <View style={styles.titleRow}>
          <Text variant="h3" style={{ flex: 1 }}>
            {task.title}
          </Text>
          <TouchableOpacity onPress={handleToggleStatus}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={isDone ? Colors.mint : Colors.gray300}
            />
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <Badge label="" status={displayStatus} dot />
          <Badge label={priorityLabels[task.priority] ?? task.priority} priority={task.priority} />
          <View style={styles.categoryChip}>
            <Ionicons
              name={cat.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={Colors.textSecondary}
            />
            <Text variant="bodySmall" color="secondary">{cat.label}</Text>
          </View>
        </View>

        {/* Description */}
        {task.description && (
          <Card padding="md">
            <Text variant="body" color="secondary">
              {task.description}
            </Text>
          </Card>
        )}

        {/* Info grid */}
        <Card padding="md">
          <View style={styles.infoGrid}>
            <InfoRow
              icon="location-outline"
              label="Zone"
              value={zoneLabels[task.zone] ?? task.zone}
            />
            {task.due_date && (
              <InfoRow
                icon="calendar-outline"
                label="Échéance"
                value={dayjs(task.due_date).format('DD MMMM YYYY')}
                valueColor={isOverdue ? Colors.error : undefined}
              />
            )}
            {task.estimated_minutes && (
              <InfoRow
                icon="time-outline"
                label="Durée estimée"
                value={`${task.estimated_minutes} min`}
              />
            )}
            <InfoRow
              icon="repeat-outline"
              label="Récurrence"
              value={recurrenceLabels[task.recurrence] ?? task.recurrence}
            />
            {assignee && (
              <InfoRow
                icon="person-outline"
                label="Assigné à"
                value={assignee.profile?.full_name ?? 'Membre'}
              />
            )}
            {task.completed_at && (
              <InfoRow
                icon="checkmark-done-outline"
                label="Terminé le"
                value={dayjs(task.completed_at).format('DD MMM YYYY à HH:mm')}
              />
            )}
          </View>
        </Card>

        {/* Time logs summary */}
        {task.time_logs && task.time_logs.length > 0 && (
          <Card padding="md">
            <Text variant="label" style={styles.sectionTitle}>
              Temps enregistré
            </Text>
            <Text variant="h4" color="mint">
              {task.time_logs.reduce((sum, tl) => sum + tl.minutes, 0)} min
            </Text>
            <Text variant="caption" color="muted">
              {task.time_logs.length} entrée{task.time_logs.length > 1 ? 's' : ''}
            </Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isDone ? 'Rouvrir la tâche' : 'Marquer terminée'}
            variant={isDone ? 'outline' : 'secondary'}
            onPress={handleToggleStatus}
            fullWidth
            leftIcon={
              <Ionicons
                name={isDone ? 'refresh-outline' : 'checkmark-circle-outline'}
                size={18}
                color={isDone ? Colors.coral : Colors.navy}
              />
            }
          />
          <Button
            label="Supprimer"
            variant="danger"
            onPress={handleDelete}
            isLoading={deleteTask.isPending}
            fullWidth
            leftIcon={
              <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} />
      <Text variant="bodySmall" color="muted" style={{ width: 100 }}>
        {label}
      </Text>
      <Text
        variant="bodySmall"
        weight="medium"
        style={[{ flex: 1 } as TextStyle, valueColor ? { color: valueColor } as TextStyle : undefined]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  detailContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoGrid: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  editActions: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
