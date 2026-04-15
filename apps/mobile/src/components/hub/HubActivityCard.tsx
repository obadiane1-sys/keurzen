import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import { Text } from '../ui/Text';
import { useRecentActivity } from '@keurzen/queries';
import type { ActivityItem } from '@keurzen/queries';
import { useHouseholdStore } from '../../stores/household.store';
import type { HouseholdMember } from '../../types';

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir le tableau de bord"
        onPress={() => router.push('/(app)/dashboard' as never)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>VOIR LE TABLEAU DE BORD</Text>
        <Ionicons name="arrow-forward" size={14} color="#967BB6" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F8FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD7E8',
    padding: 24,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#967BB6' },
  title: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#967BB6' },
  list: { gap: 14, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: '#967BB6',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#5F5475',
  },
  rowName: { fontFamily: 'Nunito_700Bold', color: '#5F5475' },
  rowTime: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(95,84,117,0.5)',
    marginTop: 2,
  },
  empty: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: 'rgba(95,84,117,0.6)',
    textAlign: 'center',
    marginVertical: 24,
  },
  skeletonGroup: { gap: 12, marginTop: 16 },
  skeletonRow: {
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: '#967BB6',
  },
});
