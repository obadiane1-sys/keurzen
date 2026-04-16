import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import { Text } from '../ui/Text';
import { useRecentActivity } from '@keurzen/queries';
import type { ActivityItem } from '@keurzen/queries';
import { useHouseholdStore } from '../../stores/household.store';
import type { HouseholdMember } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/tokens';

dayjs.extend(relativeTime);
dayjs.locale('fr');

function memberLabel(
  memberId: string | null,
  members: HouseholdMember[],
): { initial: string; name: string } {
  if (!memberId) return { initial: '?', name: 'Quelqu\'un' };
  const m = members.find((x) => x.user_id === memberId);
  const name = m?.profile?.full_name?.split(' ')[0] ?? 'Membre';
  return { initial: name.slice(0, 1).toUpperCase(), name };
}

export function HubActivityCard() {
  const router = useRouter();
  const { items, isLoading } = useRecentActivity(3);
  const members = useHouseholdStore((s) => s.members);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Activité récente</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonGroup}>
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Aucune activité récente</Text>
      ) : (
        <View style={styles.list}>
          {items.map((it: ActivityItem) => {
            const { initial, name } = memberLabel(it.memberId, members);
            const verb = it.kind === 'completed' ? 'a terminé' : 'a ajouté';
            return (
              <View key={it.id} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    <Text style={styles.rowName}>{name}</Text> {verb}{' '}
                    {it.taskTitle}
                  </Text>
                  <Text style={styles.rowTime}>
                    {dayjs(it.timestamp).fromNow().toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Voir le tableau de bord"
        onPress={() => router.push('/(app)/dashboard' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR LE TABLEAU DE BORD</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    minHeight: 240,
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
  },
  list: { gap: 14, marginTop: Spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  rowName: { fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  rowTime: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  empty: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
  skeletonGroup: { gap: Spacing.md, marginTop: Spacing.base },
  skeletonRow: {
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.primary,
  },
});
