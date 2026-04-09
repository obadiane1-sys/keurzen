'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Bell } from 'lucide-react';
import { useAuthStore } from '@keurzen/stores';
import {
  useTasks,
  useOverdueTasks,
  useTodayTasks,
  useWeeklyBalance,
  useCurrentTlx,
  useTlxDelta,
  useWeeklyObjective,
} from '@keurzen/queries';
import { formatDate, computeHouseholdScore } from '@keurzen/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TlxDetailCard } from '@/components/dashboard/TlxDetailCard';
import { WeeklyReportSection } from '@/components/dashboard/WeeklyReportSection';
import { WeeklyTipCard } from '@/components/dashboard/WeeklyTipCard';
import { ObjectiveProgressSection } from '@/components/dashboard/ObjectiveProgressSection';

const priorityColors: Record<string, string> = {
  high: 'var(--color-rose)',
  urgent: 'var(--color-rose)',
  medium: 'var(--color-miel)',
  low: 'var(--color-sauge)',
};

// ─── Score helpers ──────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-sauge)';
  if (score >= 40) return 'var(--color-miel)';
  return 'var(--color-rose)';
}

function getMotivationalMessage(score: number, firstName: string) {
  if (score >= 80) {
    return {
      title: `${firstName}, c'est parfait !`,
      subtitle: 'Votre foyer fonctionne en harmonie. Continuez sur cette lancee !',
    };
  }
  if (score >= 60) {
    return {
      title: `${firstName}, beau travail !`,
      subtitle: 'Votre equilibre est solide. Quelques ajustements et ce sera optimal.',
    };
  }
  if (score >= 40) {
    return {
      title: `${firstName}, on progresse !`,
      subtitle: 'Completez vos taches et votre score progressera cette semaine.',
    };
  }
  return {
    title: `${firstName}, courage !`,
    subtitle: 'Quelques efforts suffiront a remonter votre score cette semaine.',
  };
}

const GAUGE_LABELS = ['FRAGILE', 'A RISQUE', 'MOYEN', 'BON', 'OPTIMAL'] as const;

function getActiveLabel(score: number): string {
  if (score < 20) return 'FRAGILE';
  if (score < 40) return 'A RISQUE';
  if (score < 60) return 'MOYEN';
  if (score < 80) return 'BON';
  return 'OPTIMAL';
}

// ─── Hero Score Gauge (SVG, Lifesum-style) ──────────────────────────────────

function HeroScoreGauge({ score, color }: { score: number; color: string }) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[56px] font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-base text-text-muted -mt-1">/100</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: allTasks = [], isLoading } = useTasks();
  const overdueTasks = useOverdueTasks();
  const todayTasks = useTodayTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();
  const { data: tlxDelta } = useTlxDelta();
  const { objective, progress, isAchieved } = useWeeklyObjective();

  const { doneTasks } = useMemo(() => {
    const done: typeof allTasks = [];
    for (const t of allTasks) {
      if (t.status === 'done') done.push(t);
    }
    return { doneTasks: done };
  }, [allTasks]);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const weeklyScore = useMemo(() => {
    const totalTasks = allTasks.length;
    const completedTasks = doneTasks.length;
    const maxImbalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.abs(m.tasksDelta ?? 0)))
      : 0;
    const averageTlx = currentTlx?.score ?? 0;

    const result = computeHouseholdScore({
      completedTasks,
      totalTasks,
      maxImbalance,
      averageTlx,
      streakDays: 0, // TODO: share useHouseholdStreak to packages/queries
    });
    return result.total;
  }, [allTasks, doneTasks, balanceMembers, currentTlx]);

  const scoreColor = getScoreColor(weeklyScore);
  const message = getMotivationalMessage(weeklyScore, firstName);
  const activeLabel = getActiveLabel(weeklyScore);

  if (profile && !profile.has_seen_onboarding) {
    router.replace('/onboarding/setup');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* 1. Header — Lifesum style: section title left, icons right */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
          SCORE HEBDO DU FOYER
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/notifications')}
            className="text-text-primary hover:text-terracotta transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <Avatar src={profile?.avatar_url} name={profile?.full_name || undefined} size={34} />
        </div>
      </div>

      {/* 2. Hero Score Card (Lifesum-style) */}
      <Card className="mb-6">
        <div className="flex flex-col items-center py-4">
          {/* Gauge labels */}
          <div className="flex w-full justify-between px-2 mb-3">
            {GAUGE_LABELS.map((label) => (
              <span
                key={label}
                className={`text-[10px] tracking-wide transition-colors ${
                  label === activeLabel
                    ? 'font-bold'
                    : 'font-normal text-text-muted'
                }`}
                style={label === activeLabel ? { color: scoreColor } : undefined}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Large gauge */}
          <HeroScoreGauge score={weeklyScore} color={scoreColor} />

          {/* Motivational message */}
          <h2 className="font-heading text-2xl font-bold text-text-primary mt-6 mb-2 text-center">
            {message.title}
          </h2>
          <p className="text-base text-text-secondary text-center max-w-sm leading-relaxed mb-4 px-4">
            {message.subtitle}
          </p>

          {/* Objective progress */}
          {objective && (
            <div className="w-full px-4 mb-3">
              <ObjectiveProgressSection
                label={objective.label}
                type={objective.type}
                currentValue={objective.current_value}
                targetValue={objective.target_value}
                baselineValue={objective.baseline_value}
                progress={progress}
                achieved={isAchieved}
              />
            </div>
          )}

          {/* Divider + CTA */}
          <div className="w-full border-t border-border-light mb-3" />
          <button
            onClick={() => router.push('/dashboard/weekly-review')}
            className="text-sm font-bold tracking-wider text-terracotta hover:underline"
          >
            VOIR LES DETAILS
          </button>
        </div>
      </Card>

      {/* 3. Streak-like stat cards (side by side) */}
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
          CETTE SEMAINE
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center justify-center py-5">
            <span className="font-heading text-3xl font-extrabold text-text-primary leading-none">
              {todayTasks.length}
            </span>
            <span className="text-xs text-text-secondary mt-1">
              {todayTasks.length <= 1 ? "tache aujourd'hui" : "taches aujourd'hui"}
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center py-5">
            <span className="font-heading text-3xl font-extrabold text-text-primary leading-none">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-text-secondary mt-1">
              {overdueTasks.length <= 1 ? 'en retard' : 'en retard'}
            </span>
          </Card>
        </div>
      </div>

      {/* 4. Weekly Tip */}
      <div className="mb-6">
        <WeeklyTipCard />
      </div>

      {/* 5. Charge Mentale + 6. Taches du jour — 2 columns on desktop */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
            CHARGE MENTALE
          </p>
          <TlxDetailCard currentTlx={currentTlx} tlxDelta={tlxDelta} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
              TACHES DU JOUR
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
            REPARTITION CETTE SEMAINE
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted">
            TERMINE RECEMMENT
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
