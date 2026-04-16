'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { verifyOtp, fetchProfile } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { createSupabaseBrowser } from '@/lib/supabase/client';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { setSession, setProfile, setInitialized } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.join('');
    if (token.length !== 6) return;
    setError('');
    setLoading(true);

    const result = await verifyOtp(email, token);
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // Hydrate auth store
    const supabase = createSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setProfile(profile);
    }
    setInitialized(true);
    setLoading(false);

    router.push('/dashboard');
  };

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold">Verification</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entrez le code a 6 chiffres envoye a{' '}
          <span className="font-medium text-text-primary">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-11 rounded-[var(--radius-md)] border border-border bg-background-card text-center text-lg font-semibold text-text-primary transition-colors focus:border-primary focus:outline-none"
            />
          ))}
        </div>

        {error && (
          <div className="rounded-[var(--radius-md)] bg-accent/10 px-3 py-2">
            <p className="text-[13px] text-accent">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Verifier
        </Button>
      </form>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
