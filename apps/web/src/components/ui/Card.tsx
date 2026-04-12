import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, style, hoverable, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      style={style}
      className={cn(
        'rounded-[var(--radius-lg)] bg-background-card p-4 shadow-card',
        hoverable && 'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-md',
        onClick && 'text-left w-full',
        className,
      )}
    >
      {children}
    </Component>
  );
}
