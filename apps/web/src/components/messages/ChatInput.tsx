'use client';

import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-expand up to 120px
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  return (
    <div className="flex items-end gap-2 border-t border-border-light bg-background p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={2000}
        rows={1}
        placeholder="Votre message…"
        className={cn(
          'flex-1 resize-none rounded-xl border border-border-light bg-background-card px-3 py-2.5',
          'text-sm text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
          'disabled:opacity-50',
        )}
        style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
          value.trim() && !disabled
            ? 'bg-primary text-text-inverse hover:bg-primary/90'
            : 'bg-border-light text-text-muted',
        )}
        aria-label="Envoyer"
      >
        <Send size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
