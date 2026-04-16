'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  ShoppingBasket,
  Wallet,
  Settings,
  Activity,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import type { HubTileConfig, HubTileIcon } from '@keurzen/shared';

const ICON_MAP: Record<HubTileIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  grid: LayoutGrid,
  basket: ShoppingBasket,
  cash: Wallet,
  settings: Settings,
  pulse: Activity,
  calendar: Calendar,
  chat: MessageCircle,
};

function stripGroup(route: string): string {
  return route.replace(/^\/\(app\)/, '');
}

export function HubTile({ config }: { config: HubTileConfig }) {
  const router = useRouter();
  const Icon = ICON_MAP[config.icon];

  return (
    <button
      type="button"
      aria-label={config.label}
      onClick={() => router.push(stripGroup(config.route))}
      className={`flex min-h-[120px] flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-border px-4 py-5 transition-transform active:scale-[0.98] ${config.accent ? 'bg-primary-light' : 'bg-background-card'}`}
    >
      <Icon size={28} className="text-primary" />
      <span className="text-[10px] font-bold uppercase text-center tracking-[2px] text-text-primary font-[Nunito,sans-serif]">
        {config.label}
      </span>
    </button>
  );
}
