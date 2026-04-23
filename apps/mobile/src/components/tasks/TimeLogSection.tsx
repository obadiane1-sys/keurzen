import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import {
  useTaskTimeLogs,
  useAddTimeLog,
  useDeleteTimeLog,
} from '@keurzen/queries';
import type { TimeLog } from '@keurzen/shared';

import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

interface TimeLogSectionProps {
  taskId: string;
}

export function TimeLogSection({ taskId }: TimeLogSectionProps) {
  const { data: logs = [], isLoading } = useTaskTimeLogs(taskId);
  const [showModal, setShowModal] = useState(false);

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <Card padding="md">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={18} color={Colors.prune} />
          <Text variant="label">Temps enregistré</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} hitSlop={8}>
          <View style={styles.addButton}>
            <Ionicons name="add" size={16} color={Colors.terracotta} />
            <Text variant="caption" weight="bold" style={styles.addButtonText}>
              Ajouter
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {logs.length > 0 && (
        <View style={styles.summary}>
          <Text variant="h4" color="sauge">
            {totalMinutes} min
          </Text>
          <Text variant="caption" color="muted" style={styles.summaryMeta}>
            {logs.length} entrée{logs.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {isLoading ? (
        <Text variant="caption" color="muted">
          Chargement...
        </Text>
      ) : logs.length === 0 ? (
        <Text variant="caption" color="muted" style={styles.empty}>
          Aucune entrée de temps pour le moment.
        </Text>
      ) : (
        <View style={styles.list}>
          {logs.map((log) => (
            <TimeLogRow key={log.id} log={log} taskId={taskId} />
          ))}
        </View>
      )}

      <AddTimeLogModal
        visible={showModal}
        taskId={taskId}
        onClose={() => setShowModal(false)}
      />
    </Card>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function TimeLogRow({ log, taskId }: { log: TimeLog; taskId: string }) {
  const { mutate: deleteLog, isPending } = useDeleteTimeLog(taskId);
  const authorName = log.profile?.full_name?.split(' ')[0] ?? 'Membre';
  const when = dayjs(log.logged_at).format('DD MMM à HH:mm');

  const handleDelete = () => {
    const run = () => deleteLog(log.id);
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette entrée ?')) run();
      return;
    }
    Alert.alert('Supprimer', 'Supprimer cette entrée de temps ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text variant="bodySmall" weight="semibold">
          {log.minutes} min{' '}
          <Text variant="bodySmall" color="muted">
            par {authorName}
          </Text>
        </Text>
        <Text variant="caption" color="muted">
          {when}
        </Text>
        {log.note && (
          <Text variant="caption" color="secondary" style={styles.note}>
            {log.note}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        disabled={isPending}
        hitSlop={8}
        accessibilityLabel="Supprimer l'entrée"
      >
        <Ionicons name="trash-outline" size={16} color={Colors.rose} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Add modal ───────────────────────────────────────────────────────────────

function AddTimeLogModal({
  visible,
  taskId,
  onClose,
}: {
  visible: boolean;
  taskId: string;
  onClose: () => void;
}) {
  const { mutateAsync: addLog, isPending } = useAddTimeLog();
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMinutes('');
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    const parsed = parseInt(minutes, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Entrez un nombre de minutes positif.');
      return;
    }
    try {
      await addLog({ taskId, minutes: parsed, note });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text variant="h4">Ajouter du temps</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text variant="caption" color="muted" style={styles.modalLabel}>
            Minutes
          </Text>
          <TextInput
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            style={styles.input}
          />

          <Text variant="caption" color="muted" style={styles.modalLabel}>
            Note (facultatif)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Courses faites, vaisselle, etc."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
            style={[styles.input, styles.inputMultiline]}
          />

          {error && (
            <Text variant="caption" style={styles.error}>
              {error}
            </Text>
          )}

          <View style={styles.modalActions}>
            <Button
              label="Annuler"
              variant="outline"
              onPress={handleClose}
              style={styles.modalButton}
            />
            <Button
              label={isPending ? 'Enregistrement...' : 'Enregistrer'}
              onPress={handleSubmit}
              isLoading={isPending}
              style={styles.modalButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: Colors.terracotta,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryMeta: {
    marginBottom: 2,
  },
  empty: {
    fontStyle: 'italic',
  },
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  rowMain: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  note: {
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(61, 44, 34, 0.35)',
  },
  modalSheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalLabel: {
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  error: {
    color: Colors.rose,
    marginTop: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
