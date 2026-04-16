'use client';

import { cn } from '@/lib/utils';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <div className={cn('animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both', className)}>
      {children}
    </div>
  );
}

interface StaggerChildProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export function StaggerChild({ children, index, className }: StaggerChildProps) {
  return (
    <div
      className={cn('animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both', className)}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {children}
    </div>
  );
}
