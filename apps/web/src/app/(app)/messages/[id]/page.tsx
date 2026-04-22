'use client';

import { useParams } from 'next/navigation';
import { useConversations } from '@keurzen/queries';
import { ConversationThread } from '@/components/messages/ConversationThread';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: conversations = [] } = useConversations();
  const conversation = conversations.find((c) => c.id === id);

  if (!conversation) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <span className="text-sm text-text-muted">Conversation introuvable</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-8 md:-my-8">
      <ConversationThread conversation={conversation} />
    </div>
  );
}
