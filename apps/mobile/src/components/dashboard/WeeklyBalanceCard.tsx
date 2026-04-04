import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { KeurzenMascot } from '../ui/KeurzenMascot';
import { MemberAvatar } from './MemberAvatar';
import { ProgressBar } from './ProgressBar';
import { DCOLORS, DFONT } from './constants';

export interface BalanceMember {
  name: string;
  color: string;
  hours: number;
  topTasks: string[];
}

interface WeeklyBalanceCardProps {
  members: BalanceMember[];
}

interface BalanceConfig {
  status: string;
  color: string;
  expression: 'happy' | 'normal' | 'tired';
  textColor: string;
}

function getBalanceConfig(imbalance: number): BalanceConfig {
  if (imbalance < 20) {
    return { status: 'Équilibré', color: DCOLORS.mint, expression: 'happy', textColor: '#0F6E56' };
  }
  if (imbalance < 40) {
    return { status: 'Léger écart', color: '#FFD166', expression: 'normal', textColor: '#854F0B' };
  }
  return { status: 'Déséquilibre', color: DCOLORS.coral, expression: 'tired', textColor: '#993C1D' };
}

export function WeeklyBalanceCard({ members }: WeeklyBalanceCardProps) {
  const totalHours = members.reduce((s, m) => s + m.hours, 0);
  const maxHours = Math.max(...members.map((m) => m.hours));
  const avgHours = totalHours / members.length;
  const imbalance = avgHours > 0
    ? Math.round(
        ((maxHours - Math.min(...members.map((m) => m.hours))) / avgHours) * 100
      )
    : 0;

  const balanceConfig = getBalanceConfig(imbalance);

  return (
    <View style={styles.container}>
      {/* Header with mascot */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            variant="h4"
            weight="semibold"
            style={{ color: DCOLORS.navy, fontSize: DFONT.subtitle.size }}
          >
            Équilibre de la semaine
          </Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: balanceConfig.color + '20',
                  borderColor: balanceConfig.color + '40',
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: balanceConfig.color }]}
              />
              <Text
                variant="caption"
                weight="semibold"
                style={{ fontSize: DFONT.caption.size, color: balanceConfig.textColor }}
              >
                {balanceConfig.status}
              </Text>
            </View>
            <Text
              variant="caption"
              style={{ fontSize: DFONT.caption.size, color: DCOLORS.textMuted }}
            >
              {totalHours}h au total
            </Text>
          </View>
        </View>
        <KeurzenMascot expression={balanceConfig.expression} size={72} animated={false} />
      </View>

      {/* Member distribution */}
      <View style={styles.membersSection}>
        {members.map((member, i) => {
          const pct = totalHours > 0 ? Math.round((member.hours / totalHours) * 100) : 0;
          return (
            <View key={i} style={styles.memberBlock}>
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <MemberAvatar name={member.name} color={member.color} size={36} />
                  <Text
                    variant="body"
                    weight="semibold"
                    style={{ color: DCOLORS.navy, fontSize: DFONT.body.size }}
                  >
                    {member.name}
                  </Text>
                </View>
                <View style={styles.hoursRow}>
                  <Text
                    variant="h4"
                    weight="bold"
                    style={{ color: DCOLORS.navy, fontSize: DFONT.subtitle.size }}
                  >
                    {member.hours}h
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size }}
                  >
                    ({pct}%)
                  </Text>
                </View>
              </View>
              <ProgressBar
                value={member.hours}
                max={maxHours}
                color={member.color}
                height={12}
              />
              <View style={styles.chipsRow}>
                {member.topTasks.map((task, j) => (
                  <View key={j} style={styles.chip}>
                    <Text
                      variant="caption"
                      weight="medium"
                      style={{
                        fontSize: 12,
                        color: DCOLORS.textSecondary,
                      }}
                    >
                      {task}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DCOLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  membersSection: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 16,
  },
  memberBlock: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -2,
  },
  chip: {
    backgroundColor: DCOLORS.warmGray,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});
