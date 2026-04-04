import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  default: 'bg-border-light text-text-secondary',
  success: 'bg-sauge/15 text-sauge',
  warning: 'bg-miel/15 text-miel',
  danger: 'bg-rose/15 text-rose',
  info: 'bg-prune/15 text-prune',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
