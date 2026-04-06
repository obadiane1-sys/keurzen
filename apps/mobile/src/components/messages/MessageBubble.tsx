import React from 'react';
import { View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderName: boolean;
}

export function MessageBubble({ message, isOwn, showSenderName }: MessageBubbleProps) {
  const time = dayjs(message.created_at).format('HH:mm');
  const senderFirstName = message.sender?.full_name?.split(' ')[0] ?? 'Membre';

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      {showSenderName && !isOwn && (
        <Text variant="caption" color="terracotta" style={styles.senderName}>
          {senderFirstName}
        </Text>
      )}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        <Text
          variant="body"
          style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}
        >
          {message.content}
        </Text>
        <Text
          variant="caption"
          style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '78%',
    marginVertical: Spacing.xs / 2,
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    marginBottom: 2,
    marginLeft: Spacing.sm,
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 2,
  },
  bubbleOwn: {
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  content: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  contentOwn: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.regular,
  },
  contentOther: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.regular,
  },
  time: {
    alignSelf: 'flex-end',
    fontSize: Typography.fontSize.xs,
  },
  timeOwn: {
    color: 'rgba(255,253,249,0.65)',
    fontFamily: Typography.fontFamily.regular,
  },
  timeOther: {
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.regular,
  },
});
