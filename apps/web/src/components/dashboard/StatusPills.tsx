import { cn } from '@/lib/utils';

interface StatusPillProps {
  label: string;
  dot?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'alert';
}

function StatusPill({ label, dot, icon, variant = 'default' }: StatusPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[7px] rounded-full px-3.5 py-[7px] text-xs font-medium shrink-0',
        variant === 'default' && 'bg-background-card shadow-sm text-text-primary',
        variant === 'alert' && 'bg-rose/[0.07] border border-rose/20 text-rose',
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
      )}
      {icon}
      {label}
    </div>
  );
}

interface StatusPillsRowProps {
  householdName: string;
  todayCount: number;
  overdueCount: number;
}

export function StatusPillsRow({ householdName, todayCount, overdueCount }: StatusPillsRowProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <StatusPill dot="var(--color-sauge)" label={householdName} />
      <StatusPill
        icon={<span className="text-sm">📋</span>}
        label={`${todayCount} tache${todayCount !== 1 ? 's' : ''} aujourd'hui`}
      />
      {overdueCount > 0 && (
        <StatusPill
          dot="var(--color-rose)"
          label={`${overdueCount} en retard`}
          variant="alert"
        />
      )}
    </div>
  );
}
