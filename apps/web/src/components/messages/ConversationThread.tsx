'use client';

import { useEffect, useRef } from 'react';
import { useMessages, useSendMessage, useMarkConversationAsRead } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import type { Conversation, Message } from '@keurzen/shared';
import { MessageBubble } from './MessageBubble';
import { ReadIndicator } from './ReadIndicator';
import { ChatInput } from './ChatInput';

interface ConversationThreadProps {
  conversation: Conversation;
}

export function ConversationThread({ conversation }: ConversationThreadProps) {
  const { user } = useAuthStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Flatten pages (newest first per page) → reverse to oldest-at-top
  const messages: Message[] = (data?.pages ?? []).flatMap((page) => page).reverse();

  // Mark as read on mount and when messages change
  useEffect(() => {
    markAsRead.mutate(conversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

  function handleSend(content: string) {
    sendMessage.mutate({ conversationId: conversation.id, content });
  }

  // Find index of last own message for ReadIndicator
  const lastOwnIndex = messages.reduce<number>(
    (last, msg, i) => (msg.sender_id === user?.id ? i : last),
    -1,
  );

  const members = conversation.members ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isFetchingNextPage && (
          <div className="mb-3 text-center text-xs text-text-muted">Chargement…</div>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const prevMessage = messages[index - 1];
            const showSenderName =
              !isOwn &&
              (!prevMessage || prevMessage.sender_id !== message.sender_id);

            return (
              <div key={message.id}>
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showSenderName={showSenderName}
                />
                {index === lastOwnIndex && (
                  <ReadIndicator
                    message={message}
                    members={members}
                    currentUserId={user?.id ?? ''}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  );
}
