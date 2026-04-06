'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import {
  useConversations,
  useGetOrCreateHouseholdConversation,
  useCreateDirectConversation,
} from '@keurzen/queries';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import { ConversationList } from '@/components/messages/ConversationList';
import { ConversationThread } from '@/components/messages/ConversationThread';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import type { Conversation } from '@keurzen/shared';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { members: householdMembers } = useHouseholdStore();
  const { data: conversations = [], isLoading } = useConversations();
  const getOrCreateHousehold = useGetOrCreateHouseholdConversation();
  const createDirect = useCreateDirectConversation();

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Ensure household conversation exists on mount
  useEffect(() => {
    if (!isLoading) {
      getOrCreateHousehold.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Auto-select first conversation when conversations load and none is selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, selectedConv]);

  const handleNewDM = useCallback(
    (userId: string) => {
      createDirect.mutate(userId, {
        onSuccess: (conversationId) => {
          const conv = conversations.find((c) => c.id === conversationId);
          if (conv) setSelectedConv(conv);
        },
      });
    },
    [createDirect, conversations],
  );

  // Use household members from store (correct type, has color/role fields)
  const allMembers = householdMembers;

  return (
    <div className="h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-8 md:-my-8 flex">
      {/* Left panel — conversation list */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Messages</h2>
          <button
            onClick={() => setShowNew(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-terracotta text-white transition-opacity hover:opacity-80"
            aria-label="Nouvelle conversation"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-text-muted">Chargement...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <MessageCircle size={40} className="text-text-muted" />
            <span className="text-sm text-text-muted">Pas encore de messages</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              currentUserId={user?.id ?? ''}
              activeId={selectedConv?.id}
              onSelect={setSelectedConv}
            />
          </div>
        )}
      </div>

      {/* Right panel — thread */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedConv ? (
          <ConversationThread conversation={selectedConv} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-text-muted">
              Selectionnez une conversation
            </span>
          </div>
        )}
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        members={allMembers}
        currentUserId={user?.id ?? ''}
        onSelect={handleNewDM}
      />
    </div>
  );
}
