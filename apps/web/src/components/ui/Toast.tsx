'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-success/30 bg-success/8',
  error: 'border-accent/30 bg-accent/8',
  info: 'border-joy/30 bg-joy/8',
};

const iconColors = {
  success: 'text-success',
  error: 'text-accent',
  info: 'text-joy',
};

export function Toast({ message, type = 'info', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 shadow-md animate-in slide-in-from-bottom-4 duration-300',
        colors[type],
      )}
    >
      <Icon size={18} className={iconColors[type]} />
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-text-muted hover:text-text-primary">
        <X size={14} />
      </button>
    </div>
  );
}
