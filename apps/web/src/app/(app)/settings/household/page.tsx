'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useHouseholdStore } from '@keurzen/stores';
import {
  usePendingInvitations,
  useRevokeInvitation,
} from '@keurzen/queries';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';

dayjs.locale('fr');

export default function HouseholdPage() {
  const router = useRouter();
  const { currentHousehold, members } = useHouseholdStore();
  const { data: invitations = [] } = usePendingInvitations(currentHousehold?.id);
  const { mutate: revokeInvitation } = useRevokeInvitation();

  if (!currentHousehold) {
    return (
      <EmptyState
        variant="household"
      />
    );
  }

  const handleRevoke = (invitationId: string, email: string | null) => {
    if (confirm(`Supprimer l'invitation pour ${email || 'cet invité'} ?`)) {
      revokeInvitation(invitationId);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex h-14 items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
          aria-label="Retour"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-bold tracking-tight text-text-primary">
          Mon Foyer
        </h1>
        <div className="h-10 w-10" />
      </div>

      {/* Hero */}
      <section className="flex items-start justify-between pt-2 pb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {currentHousehold.name}
          </h2>
          <p className="text-sm text-text-muted">
            {members.length} membre{members.length > 1 ? 's' : ''}
            {currentHousehold.created_at
              ? ` · Créé en ${dayjs(currentHousehold.created_at).format('MMMM YYYY')}`
              : ''}
          </p>
        </div>
      </section>

      {/* Members */}
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
        Membres ({members.length})
      </p>

      <div className="mb-2">
        {members.map((m) => {
          const isOwner = m.role === 'owner';
          return (
            <div
              key={m.id}
              className="flex items-center gap-4 py-3 group"
            >
              <Avatar
                name={m.profile?.full_name || undefined}
                src={m.profile?.avatar_url}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {m.profile?.full_name || 'Membre'}
                  </span>
                  <span
                    className={
                      isOwner
                        ? 'rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary'
                        : 'rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-muted'
                    }
                  >
                    {isOwner ? 'Admin' : 'Membre'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted truncate">
                  {m.profile?.email || ' '}
                </p>
              </div>
              <ChevronRight size={18} className="text-border" />
            </div>
          );
        })}
      </div>

      {/* Invite link */}
      <button
        type="button"
        onClick={() => router.push('/settings/invite')}
        className="flex w-full items-center justify-center gap-1.5 py-4 text-sm font-semibold text-primary transition-opacity hover:opacity-70"
      >
        <Plus size={18} />
        Inviter un membre
      </button>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <>
          <p className="mt-4 mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
            Invitations en cours
          </p>

          <div>
            {invitations.map((inv, index) => {
              const last = index === invitations.length - 1;
              const label = inv.email || 'Invité';
              return (
                <div
                  key={inv.id}
                  className={
                    last
                      ? 'flex items-center gap-3 py-4'
                      : 'flex items-center gap-3 py-4 border-b border-border-light'
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {label}
                    </p>
                    {inv.email && (
                      <p className="mt-0.5 text-[11px] text-text-muted truncate">
                        {inv.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      En attente
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv.id, inv.email)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:text-text-primary transition-colors"
                    aria-label={`Supprimer l'invitation pour ${label}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
