import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '../ui/Text';
import { ProgressBar } from '../dashboard/ProgressBar';
import { Colors, BorderRadius, Spacing } from '../../constants/tokens';

interface Member {
  name: string;
  color: string;
  avatarUrl: string | null;
  tasksShare: number;
  minutesShare: number;
}

interface MemberBreakdownProps {
  members: Member[];
  totalMinutes: number;
}

export function MemberBreakdown({ members, totalMinutes }: MemberBreakdownProps) {
  const maxShare = Math.max(...members.map((m) => m.tasksShare), 0.01);

  return (
    <View style={styles.container}>
      <Text variant="h4" weight="semibold" style={styles.title}>
        Répartition
      </Text>

      <View style={styles.membersList}>
        {members.map((member, i) => {
          const taskPct = Math.round(member.tasksShare * 100);
          const hours = Math.round(member.minutesShare * totalMinutes / 60);

          return (
            <View key={i} style={styles.memberBlock}>
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  {member.avatarUrl ? (
                    <Image source={{ uri: member.avatarUrl }} style={[styles.avatar, { borderColor: member.color }]} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: member.color }]}>
                      <Text variant="caption" weight="bold" style={styles.avatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text variant="body" weight="semibold" style={{ color: Colors.textPrimary, fontSize: 16 }}>
                    {member.name.split(' ')[0]}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text variant="h4" weight="bold" style={{ color: Colors.textPrimary, fontSize: 18 }}>
                    {hours}h
                  </Text>
                  <Text variant="caption" style={{ color: Colors.textMuted, fontSize: 14 }}>
                    ({taskPct}%)
                  </Text>
                </View>
              </View>
              <ProgressBar
                value={member.tasksShare}
                max={maxShare}
                color={member.color}
                height={10}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 22,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    marginBottom: 18,
  },
  membersList: {
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    color: Colors.textInverse,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
});
