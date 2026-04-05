'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import {
  useTasks,
  useOverdueTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
  useTlxDelta,
} from '@keurzen/queries';
import { formatDate } from '@keurzen/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularGauge } from '@/components/dashboard/CircularGauge';
import { StatusPillsRow } from '@/components/dashboard/StatusPills';
import { NarrativeCard } from '@/components/dashboard/NarrativeCard';
import { TlxDetailCard } from '@/components/dashboard/TlxDetailCard';
import { WeeklyReportSection } from '@/components/dashboard/WeeklyReportSection';

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

function formatDateHeader(): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  const now = new Date();
  return `Aujourd'hui, ${now.getDate()} ${months[now.getMonth()]}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, household } = useAuthStore();
  const { data: allTasks = [], isLoading } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();

  const { activeTasks, doneTasks } = useMemo(() => {
    const active: typeof allTasks = [];
    const done: typeof allTasks = [];
    for (const t of allTasks) {
      if (t.status === 'done') done.push(t);
      else active.push(t);
    }
    return { activeTasks: active, doneTasks: done };
  }, [allTasks]);

  const myBalance = balanceMembers.find((m) => m.userId === profile?.id);
  const balancePercent = myBalance ? Math.round(myBalance.tasksShare * 100) : 0;
  const weeklyProgress = allTasks.length > 0
    ? Math.round((doneTasks.length / allTasks.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* 1. Header */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{formatDateHeader()}</h1>
        <Avatar src={profile?.avatar_url} name={profile?.full_name || undefined} size={38} />
      </div>

      {/* 2. Status Pills */}
      <div className="mb-6">
        <StatusPillsRow
          householdName={household?.name ?? 'Mon foyer'}
          todayCount={todayTasks.length}
          overdueCount={overdueTasks.length}
        />
      </div>

      {/* 3. Three Gauges */}
      <Card className="mb-6">
        <div className="flex justify-around items-center py-2">
          <CircularGauge
            value={currentTlx?.score ?? 0}
            max={100}
            color="var(--color-prune)"
            label="Charge mentale"
            subtitle="/ 100"
          />
          <CircularGauge
            value={balancePercent}
            max={100}
            color="var(--color-sauge)"
            label="Mon equilibre"
          />
          <CircularGauge
            value={weeklyProgress}
            max={100}
            color="var(--color-miel)"
            label="Progression"
          />
        </div>
      </Card>

      {/* 4. Narrative Card */}
      <div className="mb-6">
        <NarrativeCard
          doneTasks={doneTasks.length}
          overdueTasks={overdueTasks.length}
          tlxDelta={tlxDelta?.delta ?? null}
          hasTlx={!!currentTlx}
        />
      </div>

      {/* 5. Charge Mentale + 6. Taches du jour — 2 columns on desktop */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Charge mentale
          </p>
          <TlxDetailCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Taches du jour
            </p>
            {todayTasks.length > 0 && (
              <button
                onClick={() => router.push('/tasks')}
                className="text-xs font-medium text-terracotta hover:underline"
              >
                Tout voir
              </button>
            )}
          </div>
          <Card>
            {todayTasks.length > 0 ? (
              <div className="divide-y divide-border-light">
                {todayTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: priorityColors[t.priority] || priorityColors.medium }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-xs text-text-muted">
                        {t.assigned_profile?.full_name?.split(' ')[0] ?? 'Non assigne'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Aucune tache prevue aujourd&apos;hui
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* 7. Repartition + 8. Termine recemment — 2 columns */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Repartition cette semaine
          </p>
          <Card>
            {balanceMembers.length > 0 ? (
              <div className="space-y-3">
                {balanceMembers.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{m.name.split(' ')[0]}</p>
                      <ProgressBar value={Math.round(m.tasksShare * 100)} color={m.color} />
                    </div>
                    <span className="text-sm font-bold tabular-nums min-w-[36px] text-right">
                      {Math.round(m.tasksShare * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Pas encore de donnees cette semaine
              </p>
            )}
          </Card>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Termine recemment
          </p>
          <Card>
            {doneTasks.length > 0 ? (
              <div className="divide-y divide-border-light">
                {doneTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <CheckCircle size={16} className="text-sauge shrink-0" />
                    <p className="flex-1 text-sm text-text-secondary truncate">{t.title}</p>
                    {t.completed_at && (
                      <span className="text-xs text-text-muted shrink-0">
                        {formatDate(t.completed_at, 'DD/MM')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text-muted">
                Aucune tache terminee cette semaine
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* 9. Rapport hebdo */}
      <WeeklyReportSection />
    </>
  );
}
