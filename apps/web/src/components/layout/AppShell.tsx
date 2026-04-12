'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar (lg collapsed, xl expanded) */}
      <Sidebar />

      {/* Tablet drawer overlay */}
      {drawerOpen && (
        <Sidebar asDrawer onClose={() => setDrawerOpen(false)} />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tablet header bar — visible between md and lg (768-1023px) */}
        <header className="hidden md:flex lg:hidden items-center h-14 border-b border-border bg-background px-4 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-[var(--radius-sm)] p-2 text-text-muted hover:text-text-primary hover:bg-border-light transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            <span className="font-heading text-sm font-semibold tracking-wider">Keurzen</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto max-w-[1080px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav (< 768px) */}
      <BottomNav />
    </div>
  );
}
