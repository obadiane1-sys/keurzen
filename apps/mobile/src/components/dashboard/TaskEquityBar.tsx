import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';

interface MemberBalanceSimple {
  userId: string;
  name: string;
  tasksShare: number;
  tasksDelta: number;
}

interface TaskEquityBarProps {
  members: MemberBalanceSimple[];
}

export function TaskEquityBar({ members }: TaskEquityBarProps) {
  if (members.length < 2) return null;

  const member1 = members[0];
  const member2 = members[1];
  const pct1 = Math.round(member1.tasksShare * 100);
  const pct2 = Math.round(member2.tasksShare * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Équité des Tâches</Text>
        <View style={styles.targetBadge}>
          <View style={styles.targetDot} />
          <Text style={styles.targetText}>Cible: 45-55%</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.targetZone} />
        <View style={[styles.barSegment, styles.barLeft, { flex: pct1 || 1 }]}>
          <Text style={styles.barPercent}>{pct1}%</Text>
        </View>
        <View style={[styles.barSegment, styles.barRight, { flex: pct2 || 1 }]}>
          <Text style={[styles.barPercent, { textAlign: 'right' }]}>{pct2}%</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(150, 123, 182, 0.5)' }]} />
          <Text style={styles.memberName}>{member1.name.split(' ')[0]}</Text>
        </View>
        <View style={[styles.legendItem, { justifyContent: 'flex-end' }]}>
          <Text style={[styles.memberName, { textAlign: 'right' }]}>{member2.name.split(' ')[0]}</Text>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(244, 194, 194, 0.5)' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(150, 123, 182, 0.3)',
  },
  targetText: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  barContainer: {
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '45%',
    width: '10%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  barSegment: {
    height: '100%',
    justifyContent: 'center',
  },
  barLeft: {
    backgroundColor: 'rgba(150, 123, 182, 0.4)',
    paddingLeft: 12,
  },
  barRight: {
    backgroundColor: 'rgba(244, 194, 194, 0.4)',
    paddingRight: 12,
  },
  barPercent: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  memberName: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textPrimary,
  },
});
