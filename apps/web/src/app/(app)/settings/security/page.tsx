'use client';

import { useAuthStore } from '@keurzen/stores';
import { signOut } from '@keurzen/queries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SecurityPage() {
  const { user, reset } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    if (confirm('Vous allez etre deconnecte. Continuer ?')) {
      reset();
      await signOut();
      router.push('/auth/login');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-prune/15">
            <Shield size={20} className="text-prune" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">Authentification</h2>
            <p className="text-sm text-text-muted">Connexion par code OTP email</p>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] bg-border-light/50 px-4 py-3">
          <p className="text-sm text-text-secondary">
            Votre compte est protege par un code a usage unique envoye par email a chaque connexion.
            Aucun mot de passe n&apos;est stocke.
          </p>
        </div>
        {user?.email && (
          <p className="text-sm text-text-muted">
            Email de connexion : <span className="font-medium text-text-primary">{user.email}</span>
          </p>
        )}
      </Card>

      <Card>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut size={16} />
          Se deconnecter
        </Button>
      </Card>
    </div>
  );
}
