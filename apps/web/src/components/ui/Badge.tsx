import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  default: 'bg-border-light text-text-secondary',
  success: 'bg-success/15 text-success',
  warning: 'bg-joy/15 text-joy',
  danger: 'bg-accent/15 text-accent',
  info: 'bg-primary/15 text-primary',
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
