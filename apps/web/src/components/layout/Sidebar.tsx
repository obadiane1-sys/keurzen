'use client';

import { useRouter } from 'next/navigation';
import {
  Home, CheckCircle, Calendar, List,
  Users, Mail, Settings, LogOut, X, MessageCircle,
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
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];

interface SidebarProps {
  /** When true, renders as a drawer overlay (for tablet breakpoint) */
  asDrawer?: boolean;
  /** Callback to close the drawer */
  onClose?: () => void;
}

export function Sidebar({ asDrawer, onClose }: SidebarProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const displayName = profile?.full_name || 'Utilisateur';

  // When rendered as drawer, always expanded
  // When rendered inline: collapsed on lg (1024-1279), expanded on xl (>=1280)
  // The collapsed state for lg is handled via CSS — we render both versions
  // and show/hide with responsive classes.

  if (asDrawer) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        {/* Drawer panel */}
        <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-background shadow-lg">
          <div className="flex h-14 items-center gap-2 px-4">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-terracotta" />
            <span className="font-heading text-sm font-semibold tracking-wider">Keurzen</span>
            <button
              onClick={onClose}
              className="ml-auto rounded-[var(--radius-sm)] p-1 text-text-muted hover:text-text-primary"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          </div>
          <SidebarContent collapsed={false} router={router} displayName={displayName} onNavigate={onClose} />
        </aside>
      </>
    );
  }

  // Desktop sidebar: hidden below lg, collapsed on lg, expanded on xl
  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen flex-col border-r border-border bg-background transition-all duration-250',
        'lg:w-16 xl:w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-terracotta" />
        <span className="hidden xl:inline font-heading text-sm font-semibold tracking-wider">Keurzen</span>
      </div>

      <SidebarContent collapsed router={router} displayName={displayName} />
    </aside>
  );
}

/**
 * Inner content shared between drawer and desktop sidebar.
 * For the desktop sidebar, `collapsed` is true but we use responsive
 * classes to show labels on xl.
 */
function SidebarContent({
  collapsed,
  router,
  displayName,
  onNavigate,
}: {
  collapsed: boolean;
  router: ReturnType<typeof useRouter>;
  displayName: string;
  onNavigate?: () => void;
}) {
  // When collapsed=true (desktop), we use responsive Tailwind to toggle labels.
  // When collapsed=false (drawer), labels are always shown.
  // SidebarItem accepts `collapsed` — for the desktop case we pass a special
  // prop and handle it with CSS instead.

  return (
    <>
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        <div className="my-3 h-px bg-border-light" />
        {HOUSEHOLD_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-border-light px-2 py-3">
        <button
          onClick={() => {
            router.push('/settings');
            onNavigate?.();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors hover:bg-border-light',
            collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
          )}
        >
          <Avatar name={displayName} size={28} />
          {collapsed ? (
            <span className="hidden xl:inline truncate text-text-primary font-medium">{displayName}</span>
          ) : (
            <span className="truncate text-text-primary font-medium">{displayName}</span>
          )}
        </button>
        <SidebarItem href="/settings" icon={Settings} label="Reglages" collapsed={collapsed} onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate?.()}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-rose transition-colors hover:bg-rose/8',
            collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
          )}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {collapsed ? (
            <span className="hidden xl:inline">Se deconnecter</span>
          ) : (
            <span>Se deconnecter</span>
          )}
        </button>
      </div>
    </>
  );
}
