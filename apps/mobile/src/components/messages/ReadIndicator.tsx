import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Message, ConversationMember } from '../../types';

interface ReadIndicatorProps {
  message: Message;
  members: ConversationMember[];
  currentUserId: string;
}

export function ReadIndicator({ message, members, currentUserId }: ReadIndicatorProps) {
  const readers = members.filter(
    (m) =>
      m.user_id !== currentUserId &&
      new Date(m.last_read_at).getTime() >= new Date(message.created_at).getTime(),
  );

  if (readers.length === 0) return null;

  const names = readers
    .map((m) => m.profile?.full_name?.split(' ')[0] ?? 'Membre')
    .join(', ');

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-done" size={14} color={Colors.success} />
      <Text variant="caption" color="muted" style={styles.text}>
        {`Vu par ${names}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.xs,
    marginTop: 2,
    marginRight: Spacing.xs,
  },
  text: {
    flexShrink: 1,
  },
});
