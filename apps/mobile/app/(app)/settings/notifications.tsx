import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../../src/lib/queries/notificationPreferences';

// ─── Toggle Row ──────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  color = Colors.terracotta,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.toggleContent}>
        <Text variant="label">{label}</Text>
        <Text variant="caption" color="muted">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray200, true: Colors.terracotta + '60' }}
        thumbColor={value ? Colors.terracotta : Colors.gray400}
      />
    </View>
  );
}

// ─── Hour Picker ─────────────────────────────────────────────────────────────

function HourPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (hour: number) => void;
}) {
  const hours = [6, 7, 8, 9, 10];

  return (
    <View style={styles.hourPicker}>
      <Text variant="label" style={styles.hourLabel}>
        Heure du digest matinal
      </Text>
      <View style={styles.hourRow}>
        {hours.map((h) => {
          const active = value === h;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => onChange(h)}
              style={[styles.hourChip, active ? styles.hourChipActive : undefined]}
              activeOpacity={0.8}
            >
              <Text
                variant="bodySmall"
                weight="semibold"
                style={active ? { color: Colors.textInverse } : { color: Colors.textSecondary }}
              >
                {h}h
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificationSettingsScreen() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const handleToggle = (key: string, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };

  const handleHour = (hour: number) => {
    updatePrefs.mutate({ digest_hour: hour });
  };

  if (isLoading || !prefs) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Notifications" />
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Notifications" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="overline" color="muted">
          Types de notifications
        </Text>

        <Card padding="none">
          <ToggleRow
            icon="sunny-outline"
            label="Digest matinal"
            description="Resume des taches du jour"
            value={prefs.morning_digest}
            onValueChange={(v) => handleToggle('morning_digest', v)}
            color={Colors.rose}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="alarm-outline"
            label="Rappels de taches"
            description="30 min avant l'echeance"
            value={prefs.task_reminder}
            onValueChange={(v) => handleToggle('task_reminder', v)}
            color={Colors.miel}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="warning-outline"
            label="Alertes de retard"
            description="Quand une tache est en retard"
            value={prefs.overdue_alert}
            onValueChange={(v) => handleToggle('overdue_alert', v)}
            color={Colors.rose}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="scale-outline"
            label="Alertes desequilibre"
            description="Quand la repartition est inegale"
            value={prefs.imbalance_alert}
            onValueChange={(v) => handleToggle('imbalance_alert', v)}
            color={Colors.prune}
          />
        </Card>

        {prefs.morning_digest && (
          <>
            <Text variant="overline" color="muted" style={styles.sectionLabel}>
              Planification
            </Text>
            <Card padding="md">
              <HourPicker value={prefs.digest_hour} onChange={handleHour} />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
  },
  sectionLabel: {
    marginTop: Spacing.md,
  },
  hourPicker: {
    gap: Spacing.sm,
  },
  hourLabel: {
    color: Colors.textSecondary,
  },
  hourRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  hourChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hourChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
});
