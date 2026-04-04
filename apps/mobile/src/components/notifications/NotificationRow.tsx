import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { InAppNotification, InAppNotificationType } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

// ─── Icon map ────────────────────────────────────────────────────────────────

const typeConfig: Record<InAppNotificationType, { icon: string; color: string }> = {
  task_reminder: { icon: 'alarm-outline', color: Colors.miel },
  overdue: { icon: 'warning-outline', color: Colors.rose },
  digest: { icon: 'newspaper-outline', color: Colors.sauge },
  imbalance: { icon: 'scale-outline', color: Colors.prune },
  invitation: { icon: 'person-add-outline', color: Colors.miel },
  system: { icon: 'information-circle-outline', color: Colors.gray400 },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: InAppNotification;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const config = typeConfig[notification.type] ?? typeConfig.system;
  const isUnread = !notification.read;
  const timeAgo = dayjs(notification.created_at).fromNow();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.row, isUnread ? styles.unread : undefined]}
      accessibilityLabel={`${notification.title}${isUnread ? ', non lue' : ''}`}
      accessibilityRole="button"
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={config.color}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text variant="label" weight={isUnread ? 'semibold' : 'regular'} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text variant="bodySmall" color="secondary" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text variant="caption" color="muted">
          {timeAgo}
        </Text>
      </View>

      {/* Unread dot */}
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  unread: {
    backgroundColor: Colors.miel + '08',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.rose,
    marginTop: 6,
  },
});
