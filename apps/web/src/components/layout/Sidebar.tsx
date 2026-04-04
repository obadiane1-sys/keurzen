'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, CheckCircle, Calendar, List,
  Users, Mail, Settings, LogOut, ChevronLeft,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@keurzen/stores';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/tasks', icon: CheckCircle, label: 'Taches' },
  { href: '/calendar', icon: Calendar, label: 'Agenda' },
  { href: '/lists', icon: List, label: 'Listes' },
];

const HOUSEHOLD_ITEMS = [
  { href: '/settings/household', icon: Users, label: 'Mon foyer' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuthStore();
  const router = useRouter();
  const displayName = profile?.full_name || 'Utilisateur';

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen flex-col border-r border-border bg-background transition-all duration-250',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-terracotta" />
        {!collapsed && (
          <span className="font-heading text-sm font-semibold tracking-wider">Keurzen</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-[var(--radius-sm)] p-1 text-text-muted hover:text-text-primary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}
        <div className="my-3 h-px bg-border-light" />
        {HOUSEHOLD_ITEMS.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-border-light px-2 py-3">
        {/* Profile */}
        <button
          onClick={() => router.push('/settings')}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors hover:bg-border-light',
            collapsed && 'justify-center px-2',
          )}
        >
          <Avatar name={displayName} size={28} />
          {!collapsed && (
            <span className="truncate text-text-primary font-medium">{displayName}</span>
          )}
        </button>
        <SidebarItem href="/settings" icon={Settings} label="Reglages" collapsed={collapsed} />
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-rose transition-colors hover:bg-rose/8',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {!collapsed && <span>Se deconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
