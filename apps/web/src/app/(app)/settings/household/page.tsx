'use client';

import { useHouseholdStore } from '@keurzen/stores';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Home } from 'lucide-react';

export default function HouseholdPage() {
  const { currentHousehold, members } = useHouseholdStore();

  if (!currentHousehold) {
    return (
      <EmptyState
        icon={Home}
        title="Aucun foyer"
        subtitle="Creez ou rejoignez un foyer pour commencer"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-lg font-semibold mb-1">{currentHousehold.name}</h2>
        <p className="text-sm text-text-muted">
          Code d&apos;invitation : {currentHousehold.invite_code}
        </p>
      </Card>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Membres ({members.length})
        </p>
        <Card>
          <div className="divide-y divide-border-light">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative">
                  <Avatar
                    name={m.profile?.full_name || undefined}
                    src={m.profile?.avatar_url}
                    size={40}
                  />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background-card"
                    style={{ backgroundColor: m.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.profile?.full_name || 'Membre'}</p>
                  <p className="text-xs text-text-muted">{m.profile?.email}</p>
                </div>
                <Badge variant={m.role === 'owner' ? 'warning' : 'default'}>
                  {m.role === 'owner' ? 'Admin' : 'Membre'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
