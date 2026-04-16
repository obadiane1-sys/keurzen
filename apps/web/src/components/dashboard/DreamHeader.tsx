'use client';

import { useRouter } from 'next/navigation';

interface DreamHeaderProps {
  firstName: string;
  avatarUrl: string | null;
}

export function DreamHeader({ firstName, avatarUrl }: DreamHeaderProps) {
  const router = useRouter();
  const initial = firstName.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex items-center justify-between">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={firstName}
          className="w-11 h-11 rounded-full border-2 border-primary object-cover"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold text-white">{initial}</span>
        </div>
      )}

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
