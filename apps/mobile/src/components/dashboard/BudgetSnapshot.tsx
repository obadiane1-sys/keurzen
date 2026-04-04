import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Text } from '../ui/Text';
import { IconWallet } from './Icons';
import { DCOLORS, DFONT } from './constants';

interface BudgetCategory {
  emoji: string;
  name: string;
  amount: number;
}

interface BudgetSnapshotProps {
  /** Total spent in euros (not cents) */
  spent: number;
  /** Monthly budget limit in euros — undefined if not set */
  budget?: number;
  topCategories: BudgetCategory[];
}

function formatEuro(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' \u20AC';
}

export function BudgetSnapshot({ spent, budget, topCategories }: BudgetSnapshotProps) {
  const hasBudget = budget != null && budget > 0;
  const pct = hasBudget ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const remaining = hasBudget ? budget - spent : 0;

  let strokeColor = DCOLORS.mint;
  if (hasBudget) {
    if (pct > 80) strokeColor = DCOLORS.coral;
    else if (pct > 50) strokeColor = '#FFD166';
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <IconWallet size={22} color={DCOLORS.coralDark} />
        </View>
        <Text
          variant="h4"
          weight="semibold"
          style={{ color: DCOLORS.navy, fontSize: DFONT.subtitle.size }}
        >
          Budget du mois
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.progressRow}>
        {hasBudget && (
          <View style={styles.circleContainer}>
            <Svg viewBox="0 0 100 100" width={90} height={90}>
              <SvgCircle
                cx={50}
                cy={50}
                r={42}
                fill="none"
                stroke={DCOLORS.coral + '20'}
                strokeWidth={10}
              />
              <SvgCircle
                cx={50}
                cy={50}
                r={42}
                fill="none"
                stroke={strokeColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${pct * 2.64} 264`}
                rotation={-90}
                origin="50, 50"
              />
            </Svg>
            <View style={styles.circleLabel}>
              <Text
                variant="h3"
                weight="bold"
                style={{ fontSize: 20, fontWeight: '800', color: DCOLORS.navy }}
              >
                {pct}%
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statsColumn}>
          <View style={styles.statBlock}>
            <Text
              variant="caption"
              style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size }}
            >
              Depense ce mois
            </Text>
            <Text
              variant="h3"
              weight="bold"
              style={{ fontSize: 22, color: DCOLORS.navy }}
            >
              {formatEuro(spent)}
            </Text>
          </View>
          {hasBudget && (
            <View style={styles.statBlock}>
              <Text
                variant="caption"
                style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size }}
              >
                Restant
              </Text>
              <Text
                variant="h4"
                weight="semibold"
                style={{
                  fontSize: 18,
                  color: remaining > 0 ? DCOLORS.mint : DCOLORS.coral,
                }}
              >
                {formatEuro(remaining)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Top categories chips */}
      {topCategories.length > 0 && (
        <View style={styles.categoriesRow}>
          {topCategories.map((cat, i) => (
            <View key={i} style={styles.categoryChip}>
              <Text variant="body" style={{ fontSize: 15 }}>
                {cat.emoji}
              </Text>
              <Text
                variant="caption"
                weight="medium"
                style={{ fontSize: 13, color: DCOLORS.textSecondary }}
              >
                {cat.name}
              </Text>
              <Text
                variant="caption"
                weight="bold"
                style={{ fontSize: 13, color: DCOLORS.navy }}
              >
                {formatEuro(cat.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DCOLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DCOLORS.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 18,
  },
  circleContainer: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  circleLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsColumn: {
    flex: 1,
    gap: 8,
  },
  statBlock: {
    gap: 2,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: DCOLORS.warmGray,
    borderWidth: 1,
    borderColor: DCOLORS.border,
  },
});
