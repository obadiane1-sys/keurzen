'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export function SidebarItem({ href, icon: Icon, label, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-terracotta/12 text-terracotta'
          : 'text-text-secondary hover:bg-terracotta/8 hover:text-text-primary',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
