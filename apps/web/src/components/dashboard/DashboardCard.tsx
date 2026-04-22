'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  accentColor: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DashboardCard({ accentColor, children, onClick, className }: DashboardCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative rounded-[var(--radius-lg)] bg-background-card p-5 shadow-card border-l-4 text-left',
        onClick && 'w-full cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-md',
        className,
      )}
      style={{ borderLeftColor: accentColor }}
    >
      {children}
      {onClick && (
        <ChevronRight size={18} className="absolute top-5 right-4 text-text-muted" />
      )}
    </Wrapper>
  );
}
