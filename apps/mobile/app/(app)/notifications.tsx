import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

import { Colors, Spacing } from '../../src/constants/tokens';
import { Text } from '../../src/components/ui/Text';
import { Loader } from '../../src/components/ui/Loader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { NotificationRow } from '../../src/components/notifications/NotificationRow';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
} from '../../src/lib/queries/notifications';
import type { InAppNotification } from '../../src/types';

// ─── Group by date ───────────────────────────────────────────────────────────

interface Section {
  title: string;
  data: InAppNotification[];
}

function groupByDate(notifications: InAppNotification[]): Section[] {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const groups: Record<string, InAppNotification[]> = {};

  for (const n of notifications) {
    const date = dayjs(n.created_at).format('YYYY-MM-DD');
    let label: string;
    if (date === today) label = "Aujourd'hui";
    else if (date === yesterday) label = 'Hier';
    else label = dayjs(n.created_at).format('DD MMMM YYYY');

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const sections = useMemo(() => groupByDate(notifications), [notifications]);

  // Flatten sections into a list with headers
  const flatData = useMemo(() => {
    const items: ({ type: 'header'; title: string } | { type: 'item'; notification: InAppNotification })[] = [];
    for (const section of sections) {
      items.push({ type: 'header', title: section.title });
      for (const n of section.data) {
        items.push({ type: 'item', notification: n });
      }
    }
    return items;
  }, [sections]);

  const handlePress = useCallback(
    (notification: InAppNotification) => {
      if (!notification.read) {
        markAsRead.mutate(notification.id);
      }

      // Navigate based on type
      const data = notification.data as Record<string, string>;
      if (notification.type === 'task_reminder' || notification.type === 'overdue') {
        if (data.task_id) {
          router.push(`/(app)/tasks/${data.task_id}`);
          return;
        }
      }
      // Default: stay on notifications
    },
    [markAsRead, router]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Notifications"
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllAsRead.mutate()}>
              <Text variant="bodySmall" color="terracotta" weight="semibold">
                Tout lire
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Aucune notification"
          subtitle="Vos notifications apparaitront ici."
        />
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${index}` : item.notification.id
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text variant="overline" color="muted" style={styles.sectionHeader}>
                  {item.title}
                </Text>
              );
            }
            return (
              <NotificationRow
                notification={item.notification}
                onPress={() => handlePress(item.notification)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionHeader: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  separator: {
    height: Spacing.sm,
  },
});
