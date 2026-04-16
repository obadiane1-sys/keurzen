'use client';

interface MemberBalance {
  userId: string;
  name: string;
  tasksShare: number;
  tasksDelta: number;
}

interface TaskEquityBarProps {
  members: MemberBalance[];
}

export function TaskEquityBar({ members }: TaskEquityBarProps) {
  if (members.length < 2) return null;

  const m1 = members[0];
  const m2 = members[1];
  const pct1 = Math.round(m1.tasksShare * 100);
  const pct2 = Math.round(m2.tasksShare * 100);

  return (
    <div className="rounded-[2.5rem] p-5 border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary font-heading">
          Équité des Tâches
        </h2>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
          <span className="text-[9px] text-text-secondary font-bold uppercase">
            Cible: 45-55%
          </span>
        </div>
      </div>

      <div className="relative h-8 bg-white/60 rounded-full overflow-hidden flex border border-border shadow-inner">
        <div className="absolute inset-y-0 left-[45%] w-[10%] border-x border-white/40 bg-white/20 z-10" />
        <div className="h-full bg-primary/40 flex items-center px-3" style={{ width: `${pct1}%` }}>
          <span className="text-xs font-bold text-text-primary font-heading">{pct1}%</span>
        </div>
        <div className="h-full bg-accent/40 flex items-center justify-end px-3" style={{ width: `${pct2}%` }}>
          <span className="text-xs font-bold text-text-primary font-heading">{pct2}%</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg bg-primary/50 shadow-sm" />
          <div>
            <p className="text-xs font-bold text-text-primary leading-none">
              {m1.name.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-xs font-bold text-text-primary leading-none">
              {m2.name.split(' ')[0]}
            </p>
          </div>
          <div className="w-3 h-3 rounded-lg bg-accent/50 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
