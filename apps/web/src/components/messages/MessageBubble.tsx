'use client';

import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { Message } from '@keurzen/shared';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderName: boolean;
}

export function MessageBubble({ message, isOwn, showSenderName }: MessageBubbleProps) {
  const timeLabel = dayjs(message.created_at).format('HH:mm');

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className="flex max-w-[78%] flex-col gap-0.5">
        {showSenderName && !isOwn && (
          <span className="px-1 text-xs font-semibold text-primary">
            {message.sender?.full_name ?? 'Membre'}
          </span>
        )}

        <div
          className={cn(
            'rounded-2xl px-3 py-2',
            isOwn
              ? 'rounded-br-sm bg-primary text-text-inverse'
              : 'rounded-bl-sm border border-border-light bg-background-card text-text-primary',
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p
            className={cn(
              'mt-0.5 text-right text-[10px]',
              isOwn ? 'text-white/70' : 'text-text-muted',
            )}
          >
            {timeLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
