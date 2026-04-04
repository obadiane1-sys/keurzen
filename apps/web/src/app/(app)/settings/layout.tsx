'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/settings', label: 'Profil', exact: true },
  { href: '/settings/household', label: 'Foyer' },
  { href: '/settings/invite', label: 'Invitations' },
  { href: '/settings/security', label: 'Securite' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-[32px] font-bold mb-6">Reglages</h1>
      <div className="mb-6 flex gap-1 border-b border-border-light">
        {TABS.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
