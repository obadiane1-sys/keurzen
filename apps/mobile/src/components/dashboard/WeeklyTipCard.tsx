import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { useTasks, useOverdueTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeWeeklyTip, type WeeklyTip } from '../../lib/utils/weeklyTip';

// ─── Icon mapping ───────────────────────────────────────────────────────────

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  'alert-circle': 'alert-circle-outline',
  brain: 'medical-outline',
  scale: 'scale-outline',
  time: 'time-outline',
  'trending-up': 'trending-up-outline',
  flame: 'flame-outline',
  'checkmark-circle': 'checkmark-circle-outline',
  leaf: 'leaf-outline',
  sunny: 'sunny-outline',
};

const colorMap: Record<WeeklyTip['color'], string> = {
  rose: Colors.rose,
  prune: Colors.prune,
  miel: Colors.miel,
  sauge: Colors.sauge,
  terracotta: Colors.terracotta,
};

const bgColorMap: Record<WeeklyTip['color'], string> = {
  rose: `${Colors.rose}14`,
  prune: `${Colors.prune}14`,
  miel: `${Colors.miel}14`,
  sauge: `${Colors.sauge}14`,
  terracotta: `${Colors.terracotta}14`,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function WeeklyTipCard() {
  const { data: allTasks = [] } = useTasks();
  const overdueTasks = useOverdueTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();

  const tip = useMemo(() => {
    const doneTasks = allTasks.filter((t) => t.status === 'done').length;
    const weeklyProgress = allTasks.length > 0
      ? Math.round((doneTasks / allTasks.length) * 100)
      : 0;

    const myBalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.round(m.tasksShare * 100)))
      : 50;

    return computeWeeklyTip({
      overdueCount: overdueTasks.length,
      tlxScore: currentTlx?.score ?? null,
      balancePercent: myBalance,
      weeklyProgress,
      streakDays,
      memberCount: balanceMembers.length,
    });
  }, [allTasks, overdueTasks, balanceMembers, currentTlx, streakDays]);

  const accent = colorMap[tip.color];
  const bg = bgColorMap[tip.color];
  const ionIcon = iconMap[tip.icon] ?? 'bulb-outline';

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={ionIcon} size={20} color={accent} />
      </View>
      <View style={styles.content}>
        <Text variant="overline" color="muted" style={styles.label}>
          Conseil de la semaine
        </Text>
        <Text variant="bodySmall" weight="bold" style={{ color: accent }}>
          {tip.title}
        </Text>
        <Text variant="caption" color="secondary" style={styles.body}>
          {tip.body}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 3,
    padding: Spacing.base,
    ...Shadows.card,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    marginBottom: 2,
  },
  body: {
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
});
