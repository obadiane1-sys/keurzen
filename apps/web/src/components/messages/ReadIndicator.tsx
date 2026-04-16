'use client';

import { CheckCheck } from 'lucide-react';
import type { Message, ConversationMember } from '@keurzen/shared';

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
    <div className="flex items-center justify-end gap-1 px-4">
      <CheckCheck size={14} className="text-success" strokeWidth={2} />
      <span className="text-xs text-text-muted">Vu par {names}</span>
    </div>
  );
}
