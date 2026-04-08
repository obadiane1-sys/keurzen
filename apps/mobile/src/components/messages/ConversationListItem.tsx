import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { Colors, Spacing, BorderRadius, TouchTarget } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Conversation } from '../../types';

dayjs.extend(isToday);

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

function formatTime(dateStr: string): string {
  const d = dayjs(dateStr);
  if (d.isToday()) return d.format('HH:mm');
  return d.format('DD/MM');
}

export function getConversationTitle(conversation: Conversation, currentUserId: string): string {
  if (conversation.type === 'household') return 'Groupe foyer';
  const others = (conversation.members ?? []).filter((m) => m.user_id !== currentUserId);
  if (others.length === 0) return 'Conversation';
  return others.map((m) => m.profile?.full_name ?? 'Membre').join(', ');
}

function getPreview(conversation: Conversation, currentUserId: string): string {
  const msg = conversation.last_message;
  if (!msg) return 'Aucun message';
  const content = msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content;
  if (msg.sender_id === currentUserId) return `Vous : ${content}`;
  const firstName = msg.sender?.full_name?.split(' ')[0] ?? 'Membre';
  return `${firstName} : ${content}`;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  onPress,
}: ConversationListItemProps) {
  const isHousehold = conversation.type === 'household';
  const title = getConversationTitle(conversation, currentUserId);
  const preview = getPreview(conversation, currentUserId);
  const unread = conversation.unread_count ?? 0;
  const lastMessageTime = conversation.last_message?.created_at;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: isHousehold ? Colors.sauge + '33' : Colors.terracotta + '22' },
        ]}
      >
        <Ionicons
          name={isHousehold ? 'home' : 'person'}
          size={20}
          color={isHousehold ? Colors.sauge : Colors.terracotta}
        />
      </View>

      {/* Center content */}
      <View style={styles.center}>
        <View style={styles.topRow}>
          <Text variant="label" weight="semibold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {lastMessageTime && (
            <Text variant="caption" color="muted">
              {formatTime(lastMessageTime)}
            </Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text variant="bodySmall" color="muted" numberOfLines={1} style={styles.preview}>
            {preview}
          </Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" color="inverse" style={styles.badgeText}>
                {unread > 99 ? '99+' : String(unread)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    gap: Spacing.md,
    minHeight: TouchTarget.min,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  center: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  preview: {
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
