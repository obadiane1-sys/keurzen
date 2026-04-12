'use client';

import { useRouter } from 'next/navigation';

interface DreamHeaderProps {
  firstName: string;
}

export function DreamHeader({ firstName }: DreamHeaderProps) {
  const router = useRouter();
  const today = new Date();
  const dateDisplay = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalized = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl p-0.5 overflow-hidden shadow-sm rotate-3 border border-border">
          <div className="w-full h-full rounded-2xl bg-background-card flex items-center justify-center text-2xl">
            🏠
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-primary font-heading">
            {capitalized}
          </p>
          <p className="text-base font-bold text-text-primary">
            Bonjour, <span className="text-accent">{firstName}</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => router.push('/notifications')}
        className="relative w-10 h-10 flex items-center justify-center bg-white border border-border rounded-full shadow-sm hover:shadow-md transition-shadow"
        aria-label="Notifications"
      >
        <span className="text-base">🔔</span>
        <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-white" />
      </button>
    </div>
  );
}
