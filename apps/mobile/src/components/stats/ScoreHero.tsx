import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { getDeltaColor } from '@keurzen/shared';

interface Props {
  score: number;
  delta: number | null;
  coachMessage: string | null;
}

export function ScoreHero({ score, delta, coachMessage }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.overline}>Score global</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{score}</Text>
        {delta !== null && delta !== 0 && (
          <Text style={[styles.delta, { color: getDeltaColor(delta) }]}>
            {`${delta > 0 ? '+' : ''}${delta}%`}
          </Text>
        )}
      </View>
      {coachMessage && <Text style={styles.coachMessage}>{`« ${coachMessage} »`}</Text>}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  overline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.md,
  },
  score: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 88,
    lineHeight: 96,
    color: Colors.textPrimary,
  },
  delta: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.sm,
  },
  coachMessage: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.xl,
  },
});
