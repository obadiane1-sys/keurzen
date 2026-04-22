'use client';

import { useMemo } from 'react';
import {
  AlertCircle,
  Brain,
  Scale,
  Clock,
  TrendingUp,
  Flame,
  CheckCircle,
  Leaf,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import {
  useTasks,
  useOverdueTasks,
  useWeeklyBalance,
  useCurrentTlx,
} from '@keurzen/queries';
import { Card } from '@/components/ui/Card';
import { computeWeeklyTip, type WeeklyTip } from '@/lib/utils/weeklyTip';

const iconMap: Record<string, LucideIcon> = {
  'alert-circle': AlertCircle,
  brain: Brain,
  scale: Scale,
  time: Clock,
  'trending-up': TrendingUp,
  flame: Flame,
  'checkmark-circle': CheckCircle,
  leaf: Leaf,
  sunny: Sun,
};

const colorMap: Record<WeeklyTip['color'], string> = {
  rose: 'var(--color-rose)',
  prune: 'var(--color-prune)',
  miel: 'var(--color-miel)',
  sauge: 'var(--color-sauge)',
  terracotta: 'var(--color-terracotta)',
};

const bgClassMap: Record<WeeklyTip['color'], string> = {
  rose: 'bg-rose/8',
  prune: 'bg-prune/8',
  miel: 'bg-miel/8',
  sauge: 'bg-sauge/8',
  terracotta: 'bg-terracotta/8',
};

const textClassMap: Record<WeeklyTip['color'], string> = {
  rose: 'text-rose',
  prune: 'text-prune',
  miel: 'text-miel',
  sauge: 'text-sauge',
  terracotta: 'text-terracotta',
};

export function WeeklyTipCard() {
  const { data: allTasks = [] } = useTasks();
  const overdueTasks = useOverdueTasks();
  const { members: balanceMembers } = useWeeklyBalance();
  const { data: currentTlx } = useCurrentTlx();

  const tip = useMemo(() => {
    const doneTasks = allTasks.filter((t) => t.status === 'done').length;
    const weeklyProgress = allTasks.length > 0
      ? Math.round((doneTasks / allTasks.length) * 100)
      : 0;

    const myBalance = balanceMembers.length > 0
      ? Math.max(...balanceMembers.map((m) => Math.round(m.tasksShare * 100)))
      : 50;

    return computeWeeklyTip({
      overdueCount: overdueTasks.length,
      tlxScore: currentTlx?.score ?? null,
      balancePercent: myBalance,
      weeklyProgress,
      streakDays: 0,
      memberCount: balanceMembers.length,
    });
  }, [allTasks, overdueTasks, balanceMembers, currentTlx]);

  const Icon = iconMap[tip.icon] ?? Sun;
  const accent = colorMap[tip.color];

  return (
    <Card className="flex items-start gap-3 border-l-[3px]" style={{ borderLeftColor: accent }}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bgClassMap[tip.color]}`}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
          Conseil de la semaine
        </p>
        <p className={`text-sm font-bold ${textClassMap[tip.color]}`}>
          {tip.title}
        </p>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          {tip.body}
        </p>
      </div>
    </Card>
  );
}
