'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckCircle, Calendar, List, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/tasks', icon: CheckCircle, label: 'Taches' },
  { href: '/calendar', icon: Calendar, label: 'Agenda' },
  { href: '/lists', icon: List, label: 'Listes' },
  { href: '/settings', icon: Menu, label: 'Menu' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border bg-background-card shadow-md">
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-terracotta' : 'text-text-muted',
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
