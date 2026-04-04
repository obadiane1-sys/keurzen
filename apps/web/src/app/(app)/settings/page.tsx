'use client';

import { useState } from 'react';
import { useAuthStore } from '@keurzen/stores';
import { updateProfile } from '@keurzen/queries';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { User, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { profile, user, setProfile } = useAuthStore();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    const result = await updateProfile(user.id, { full_name: fullName.trim() });
    setSaving(false);
    if (!result.error) {
      setProfile({ ...profile!, full_name: fullName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={fullName || undefined} src={profile?.avatar_url} size={64} />
        <div>
          <p className="font-heading text-lg font-semibold">{fullName || 'Utilisateur'}</p>
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>

      <Input
        label="Nom complet"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        leftIcon={User}
      />

      <div>
        <label className="text-[13px] font-medium text-text-secondary">Email</label>
        <div className="mt-1.5 flex h-11 items-center rounded-[var(--radius-md)] border border-border-light bg-border-light/30 px-4">
          <Mail size={16} className="mr-2 text-text-muted" />
          <span className="text-sm text-text-secondary">{user?.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} isLoading={saving}>
          Enregistrer
        </Button>
        {success && <span className="text-sm text-sauge font-medium">Enregistre</span>}
      </div>
    </Card>
  );
}
