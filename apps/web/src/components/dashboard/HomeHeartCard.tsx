'use client';

import { useRouter } from 'next/navigation';

export function HomeHeartCard() {
  const router = useRouter();

  return (
    <div className="rounded-[var(--radius-v2-md)] bg-v2-tertiary-container p-6 pb-8 ml-10">
      <p className="text-sm text-v2-on-surface-variant mb-3">
        Que voulez-vous faire ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/tasks/create')}
          className="rounded-[var(--radius-v2-xl)] bg-v2-primary text-v2-on-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
        >
          Ajouter une tache
        </button>
        <button
          onClick={() => router.push('/dashboard/tlx')}
          className="rounded-[var(--radius-v2-xl)] bg-v2-surface-lowest text-v2-on-surface px-5 py-2.5 text-sm font-semibold border border-v2-outline-variant transition-colors hover:bg-white"
        >
          Remplir le TLX
        </button>
      </div>
    </div>
  );
}
