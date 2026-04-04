import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-border-light">
        <Icon size={24} className="text-text-muted" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-text-primary">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-text-secondary">{subtitle}</p>}
      {action && (
        <Button size="md" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
