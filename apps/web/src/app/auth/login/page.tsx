'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sendOtpForLogin } from '@keurzen/queries';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    const result = await sendOtpForLogin(email.trim());
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
        <h1 className="font-heading text-2xl font-bold">Se connecter</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entrez votre email pour recevoir un code de connexion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={Mail}
          autoFocus
        />

        {error && (
          <div className="rounded-[var(--radius-md)] bg-rose/10 px-3 py-2">
            <p className="text-[13px] text-rose">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Envoyer le code
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Pas de compte ?{' '}
        <Link href="/auth/signup" className="font-medium text-terracotta hover:underline">
          Creer un compte
        </Link>
      </p>
    </>
  );
}
