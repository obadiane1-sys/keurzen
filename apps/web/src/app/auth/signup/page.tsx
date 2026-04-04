'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUp } from '@keurzen/queries';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setError('');
    setLoading(true);

    const result = await signUp(email.trim(), fullName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold">Creer un compte</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Rejoignez Keurzen pour gerer votre foyer en equipe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Prenom et nom"
          placeholder="Votre nom"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={User}
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={Mail}
        />

        {error && (
          <div className="rounded-[var(--radius-md)] bg-rose/10 px-3 py-2">
            <p className="text-[13px] text-rose">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Creer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Deja un compte ?{' '}
        <Link href="/auth/login" className="font-medium text-terracotta hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
