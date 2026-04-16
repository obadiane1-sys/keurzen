'use client';

import type { Conversation } from '@keurzen/shared';
import { ConversationListItem } from './ConversationListItem';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeId?: string;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({
  conversations,
  currentUserId,
  activeId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conversation={conv}
          currentUserId={currentUserId}
          isActive={conv.id === activeId}
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
}
