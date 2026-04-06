'use client';

import { X } from 'lucide-react';
import type { HouseholdMember } from '@keurzen/shared';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export function NewConversationDialog({
  open,
  onClose,
  members,
  currentUserId,
  onSelect,
}: NewConversationDialogProps) {
  if (!open) return null;

  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Nouveau message</h2>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member list */}
        {otherMembers.length === 0 ? (
          <p className="text-sm text-text-muted">
            Aucun autre membre dans votre foyer.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {otherMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  onSelect(member.user_id);
                  onClose();
                }}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors hover:bg-border-light"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm text-text-primary">
                  {member.profile?.full_name ?? 'Membre'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
