import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Text } from '../ui/Text';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import { useNotifications } from '@keurzen/queries';

dayjs.locale('fr');

export function HubHeader() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();
  const { data: notifications = [] } = useNotifications();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const dateLabel = dayjs().format('dddd D MMMM').toUpperCase();
  const householdName = currentHousehold?.name ?? 'MON FOYER';

  const unreadCount = notifications.filter(
    (n: { read: boolean }) => !n.read,
  ).length;

  const avatarInitial = firstName.slice(0, 1).toUpperCase() || '?';

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/(app)/notifications' as never)}
          style={styles.bellWrap}
        >
          <Ionicons name="notifications-outline" size={22} color="#967BB6" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.greeting} numberOfLines={1}>
          Bonjour {firstName || 'toi'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {dateLabel} · {householdName.toUpperCase()}
        </Text>
      </View>

      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil"
          onPress={() => router.push('/(app)/settings' as never)}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  left: { width: 44, alignItems: 'flex-start' },
  right: { width: 44, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#967BB6',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  greeting: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#5F5475',
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(95,84,117,0.7)',
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5DBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#5F5475',
  },
});
