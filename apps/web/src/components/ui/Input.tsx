import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon: LeftIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {LeftIcon && (
            <LeftIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-11 w-full rounded-[var(--radius-md)] border border-border bg-background-card px-4 text-[15px] text-text-primary placeholder:text-text-muted transition-colors',
              'focus:border-primary focus:ring-0 focus:outline-none',
              LeftIcon && 'pl-10',
              error && 'border-accent',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-accent">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
