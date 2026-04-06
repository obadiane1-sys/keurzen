import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { Colors, Spacing } from '../../../src/constants/tokens';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { ChatInput } from '../../../src/components/messages/ChatInput';
import { ReadIndicator } from '../../../src/components/messages/ReadIndicator';
import {
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
  useConversations,
} from '../../../src/lib/queries/messaging';
import { useMessagingRealtime } from '../../../src/hooks/useMessagingRealtime';
import { useAuthStore } from '../../../src/stores/auth.store';
import type { Message, Conversation } from '../../../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getConversationTitle(
  conversation: Conversation | undefined,
  currentUserId: string
): string {
  if (!conversation) return 'Messages';
  if (conversation.type === 'household') return 'Groupe foyer';
  const others = (conversation.members ?? []).filter((m) => m.user_id !== currentUserId);
  if (others.length === 0) return 'Conversation';
  return others.map((m) => m.profile?.full_name ?? 'Membre').join(', ');
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: conversations } = useConversations();
  const conversation = useMemo(
    () => conversations?.find((c) => c.id === id),
    [conversations, id]
  );

  const members = useMemo(() => conversation?.members ?? [], [conversation?.members]);

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useMessages(id);

  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();

  // Subscribe to realtime updates
  useMessagingRealtime(id);

  // Flatten infinite pages — messages ordered newest-first
  const messages: Message[] = useMemo(
    () => messagesData?.pages.flat() ?? [],
    [messagesData]
  );

  // The first message from the current user in the array (newest sent by me)
  const lastOwnMessageId = useMemo(
    () => messages.find((m) => m.sender_id === user?.id)?.id ?? null,
    [messages, user?.id]
  );

  // Mark as read on mount and when messages update
  const markedRef = useRef(false);
  useEffect(() => {
    if (id && messages.length > 0) {
      markAsRead.mutate(id);
      markedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, messages.length]);

  const handleSend = useCallback(
    (content: string) => {
      if (!id) return;
      sendMessage.mutate({ conversationId: id, content });
    },
    [id, sendMessage]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const title = getConversationTitle(conversation, user?.id ?? '');
  const isHousehold = conversation?.type === 'household';

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.sender_id === user?.id;
      return (
        <View>
          <MessageBubble
            message={item}
            isOwn={isOwn}
            showSenderName={isHousehold && !isOwn}
          />
          {item.id === lastOwnMessageId && (
            <ReadIndicator
              message={item}
              members={members}
              currentUserId={user?.id ?? ''}
            />
          )}
        </View>
      );
    },
    [user?.id, lastOwnMessageId, members, isHousehold]
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title={title} showBack />

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
        />

        <ChatInput
          onSend={handleSend}
          disabled={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
});
