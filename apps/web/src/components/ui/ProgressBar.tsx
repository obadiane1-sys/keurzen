import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color = 'var(--color-primary)', className }: ProgressBarProps) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-border-light', className)}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}
