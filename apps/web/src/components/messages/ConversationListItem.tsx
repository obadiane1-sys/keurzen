'use client';

import dayjs from 'dayjs';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@keurzen/shared';

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const isHousehold = conversation.type === 'household';

  // Title
  const title = isHousehold
    ? 'Groupe foyer'
    : (conversation.members ?? [])
        .filter((m) => m.user_id !== currentUserId)
        .map((m) => m.profile?.full_name ?? 'Membre')
        .join(', ') || 'Conversation';

  // Time
  const lastTime = conversation.last_message?.created_at ?? conversation.created_at;
  const d = dayjs(lastTime);
  const timeLabel = d.isSame(dayjs(), 'day')
    ? d.format('HH:mm')
    : d.format('DD/MM');

  // Preview
  let preview = 'Aucun message';
  if (conversation.last_message) {
    const msg = conversation.last_message;
    const isOwn = msg.sender_id === currentUserId;
    if (isOwn) {
      preview = `Vous\u00a0: ${msg.content}`;
    } else {
      const firstName = msg.sender?.full_name?.split(' ')[0] ?? 'Membre';
      preview = `${firstName}\u00a0: ${msg.content}`;
    }
  }

  const unread = conversation.unread_count ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-card)] p-3 text-left transition-colors',
        isActive ? 'bg-border-light' : 'hover:bg-border-light/50',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isHousehold ? 'bg-sauge/15' : 'bg-terracotta/15',
        )}
      >
        {isHousehold ? (
          <Home size={18} className="text-sauge" strokeWidth={1.8} />
        ) : (
          <User size={18} className="text-terracotta" strokeWidth={1.8} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: title + time */}
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate text-sm font-semibold text-text-primary">{title}</span>
          <span className="shrink-0 text-xs text-text-muted">{timeLabel}</span>
        </div>

        {/* Bottom row: preview + unread badge */}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex-1 truncate text-xs text-text-muted">{preview}</span>
          {unread > 0 && (
            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-text-inverse">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
