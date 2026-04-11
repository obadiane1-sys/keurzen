'use client';

import { useRouter } from 'next/navigation';
import {
  Home, CheckCircle, Calendar, List, Wallet,
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
  { href: '/budget', icon: Wallet, label: 'Budget' },
];

const HOUSEHOLD_ITEMS = [
  { href: '/settings/household', icon: Users, label: 'Mon foyer' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];

interface SidebarProps {
  asDrawer?: boolean;
  onClose?: () => void;
}

export function Sidebar({ asDrawer, onClose }: SidebarProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const displayName = profile?.full_name || 'Utilisateur';

  if (asDrawer) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-v2-surface-container">
          <div className="flex h-14 items-center gap-2 px-4">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-v2-primary" />
            <span className="text-sm font-semibold tracking-wider text-v2-on-surface">Keurzen</span>
            <button
              onClick={onClose}
              className="ml-auto rounded-[var(--radius-v2-md)] p-1 text-v2-on-surface-variant hover:text-v2-on-surface"
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

  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen flex-col bg-v2-surface-container transition-all duration-250',
        'lg:w-16 xl:w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-v2-primary" />
        <span className="hidden xl:inline text-sm font-semibold tracking-wider text-v2-on-surface">Keurzen</span>
      </div>
      <SidebarContent collapsed router={router} displayName={displayName} />
    </aside>
  );
}

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
        <div className="pt-6">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-v2-on-surface-variant hidden xl:block">
            Foyer
          </p>
        </div>
        {HOUSEHOLD_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-1 px-2 py-3">
        <button
          onClick={() => {
            router.push('/settings');
            onNavigate?.();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-v2-md)] px-3 py-2 text-sm transition-colors hover:bg-v2-surface',
            collapsed && 'lg:justify-center lg:px-2 xl:justify-start xl:px-3',
          )}
        >
          <Avatar name={displayName} size={28} className="bg-v2-primary-container text-v2-primary" />
          {collapsed ? (
            <span className="hidden xl:inline truncate text-v2-on-surface font-medium">{displayName}</span>
          ) : (
            <span className="truncate text-v2-on-surface font-medium">{displayName}</span>
          )}
        </button>
        <SidebarItem href="/settings" icon={Settings} label="Reglages" collapsed={collapsed} onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate?.()}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius-v2-md)] px-3 py-2 text-sm font-medium text-v2-secondary transition-colors hover:bg-v2-secondary/8',
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
