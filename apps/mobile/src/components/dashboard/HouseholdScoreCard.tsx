import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/tokens';
import { useTasks } from '../../lib/queries/tasks';
import { useWeeklyBalance } from '../../lib/queries/weekly-stats';
import { useCurrentTlx } from '../../lib/queries/tlx';
import { useHouseholdStreak } from '../../hooks/useHouseholdStreak';
import { computeHouseholdScore } from '../../lib/utils/householdScore';
import { useWeeklyObjective } from '../../lib/queries/objectives';
import { ObjectiveProgressSection } from './ObjectiveProgressSection';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return Colors.sauge;
  if (score >= 40) return Colors.miel;
  return Colors.rose;
}

function getMotivationalMessage(score: number, firstName: string): { title: string; subtitle: string } {
  if (score >= 80) {
    return {
      title: `${firstName}, c'est parfait !`,
      subtitle: 'Votre foyer fonctionne en harmonie. Continuez sur cette lancee !',
    };
  }
  if (score >= 60) {
    return {
      title: `${firstName}, beau travail !`,
      subtitle: 'Votre equilibre est solide. Quelques ajustements et ce sera optimal.',
    };
  }
  if (score >= 40) {
    return {
      title: `${firstName}, on progresse !`,
      subtitle: 'Completez vos taches et votre score progressera cette semaine.',
    };
  }
  return {
    title: `${firstName}, courage !`,
    subtitle: 'Quelques efforts suffiront a remonter votre score cette semaine.',
  };
}

// ─── Gauge Labels (Lifesum-style) ───────────────────────────────────────────

const GAUGE_LABELS = ['FRAGILE', 'A RISQUE', 'MOYEN', 'BON', 'OPTIMAL'] as const;

function getActiveLabel(score: number): string {
  if (score < 20) return 'FRAGILE';
  if (score < 40) return 'A RISQUE';
  if (score < 60) return 'MOYEN';
  if (score < 80) return 'BON';
  return 'OPTIMAL';
}

// ─── Ring constants ──────────────────────────────────────────────────────────

const RING_SIZE = 220;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Component ───────────────────────────────────────────────────────────────

interface HouseholdScoreCardProps {
  firstName?: string;
}

export function HouseholdScoreCard({ firstName = '' }: HouseholdScoreCardProps) {
  const router = useRouter();
  const { data: allTasks = [] } = useTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: streakDays = 0 } = useHouseholdStreak();
  const { objective, progress, isAchieved } = useWeeklyObjective();

  const scoreResult = useMemo(() => {
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const totalTasks = allTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta)))
      : 0;
    const averageTlx = currentTlx?.score ?? 0;

    return computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays,
    });
  }, [allTasks, balanceMembers, currentTlx, streakDays]);

  const scoreColor = getScoreColor(scoreResult.total);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - scoreResult.total / 100);
  const message = getMotivationalMessage(scoreResult.total, firstName);
  const activeLabel = getActiveLabel(scoreResult.total);

  return (
    <View style={styles.card}>
      {/* ── Gauge labels ── */}
      <View style={styles.labelsRow}>
        {GAUGE_LABELS.map((label) => {
          const isActive = label === activeLabel;
          return (
            <Text
              key={label}
              variant="caption"
              weight={isActive ? 'bold' : 'regular'}
              style={[
                styles.gaugeLabel,
                { color: isActive ? scoreColor : Colors.textMuted },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>

      {/* ── Large centered gauge ── */}
      <View style={styles.gaugeContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.gray100} stopOpacity="1" />
              <Stop offset="1" stopColor={Colors.borderLight} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          {/* Background ring */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#scoreGradient)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Score ring */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={scoreColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center content */}
        <View style={styles.gaugeCenter}>
          <Text
            variant="display"
            weight="extrabold"
            style={[styles.scoreNumber, { color: Colors.textPrimary }]}
          >
            {scoreResult.total}
          </Text>
          <Text variant="bodySmall" color="muted" style={styles.scoreMax}>
            /100
          </Text>
        </View>
      </View>

      {/* ── Motivational message ── */}
      <Text variant="h3" weight="bold" style={styles.motivTitle}>
        {message.title}
      </Text>
      <Text variant="body" color="secondary" style={styles.motivSubtitle}>
        {message.subtitle}
      </Text>

      {/* ── Objective progress (if any) ── */}
      {objective && (
        <ObjectiveProgressSection
          label={objective.label}
          type={objective.type}
          currentValue={objective.current_value}
          targetValue={objective.target_value}
          baselineValue={objective.baseline_value}
          progress={progress}
          achieved={isAchieved}
        />
      )}

      {/* ── Divider + CTA ── */}
      <View style={styles.ctaDivider} />
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push('/(app)/dashboard/analytics')}
        activeOpacity={0.7}
      >
        <Text variant="label" weight="bold" style={styles.ctaText}>
          VOIR LES DETAILS
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },

  // Gauge labels row
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  gaugeLabel: {
    fontSize: Typography.fontSize.xs - 1,
    letterSpacing: 0.8,
  },

  // Large gauge
  gaugeContainer: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  scoreNumber: {
    fontSize: 56,
    lineHeight: 64,
  },
  scoreMax: {
    fontSize: Typography.fontSize.md,
    marginTop: -4,
  },

  // Motivational text
  motivTitle: {
    fontSize: Typography.fontSize['2xl'],
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  motivSubtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.6,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.base,
  },

  // CTA
  ctaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
    width: '100%',
    marginBottom: Spacing.base,
  },
  ctaButton: {
    paddingVertical: Spacing.sm,
  },
  ctaText: {
    color: Colors.terracotta,
    fontSize: Typography.fontSize.sm,
    letterSpacing: 1.2,
  },
});
