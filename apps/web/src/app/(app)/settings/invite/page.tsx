'use client';

import { useState } from 'react';
import { Mail, Trash2, Clock } from 'lucide-react';
import { usePendingInvitations, useSendEmailInvitation, useRevokeInvitation } from '@keurzen/queries';
import { useHouseholdStore } from '@keurzen/stores';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import dayjs from 'dayjs';

export default function InvitePage() {
  const { currentHousehold } = useHouseholdStore();
  const { data: invitations = [] } = usePendingInvitations(currentHousehold?.id);
  const { mutateAsync: sendInvite, isPending: isSending } = useSendEmailInvitation();
  const { mutate: revokeInvitation } = useRevokeInvitation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    try {
      await sendInvite({ email: email.trim() });
      setSuccess(`Invitation envoyee a ${email.trim()}`);
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRevoke = (invitationId: string, invEmail: string | null) => {
    if (confirm(`Revoquer l'invitation pour ${invEmail || 'cet utilisateur'} ?`)) {
      revokeInvitation(invitationId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Send invitation */}
      <Card className="space-y-4">
        <h2 className="font-heading text-base font-semibold">Inviter un membre</h2>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Email du membre"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
            />
          </div>
          <Button onClick={handleSend} isLoading={isSending} className="shrink-0 self-end">
            Inviter
          </Button>
        </div>
        {error && <p className="text-[13px] text-accent">{error}</p>}
        {success && <p className="text-[13px] text-success">{success}</p>}
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Invitations en attente ({invitations.length})
          </p>
          <Card>
            <div className="divide-y divide-border-light">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-joy/15">
                    <Mail size={16} className="text-joy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email || 'Lien'}</p>
                    <p className="text-xs text-text-muted">
                      <Clock size={10} className="inline mr-1" />
                      Expire {dayjs(inv.expires_at).format('DD/MM')}
                    </p>
                  </div>
                  <Badge variant="warning">En attente</Badge>
                  <button
                    onClick={() => handleRevoke(inv.id, inv.email)}
                    className="rounded p-1.5 text-text-muted hover:text-accent hover:bg-accent/8 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
