import { useMemo } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuthStore } from '@keurzen/stores';
import {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
} from '@keurzen/shared';
import type { CoachLevel, HouseholdScoreResult } from '@keurzen/shared';
import { useTasks } from './useTasks';
import { useWeeklyBalance } from './useWeeklyStats';
import type { MemberBalance } from './useWeeklyStats';
import { useHouseholdScore } from './useHouseholdScore';
import { useAnalyticsTrends } from './useAnalyticsTrends';
import { useCurrentTlx } from './useTlx';

dayjs.extend(isoWeek);

// ─── Public Types ─────────────────────────────────────────────────────────────

export type StatsScope = 'me' | 'household';
export type StatsPeriod = 'day' | 'week';

export interface StatsKpi {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface StatsTrendPoint {
  label: string;
  value: number;
}

export interface StatsResult {
  scope: StatsScope;
  period: StatsPeriod;
  /** null when scope === 'me' */
  score: HouseholdScoreResult | null;
  scoreDelta: number | null;
  coachMessage: string | null;
  kpis: StatsKpi[];
  members: MemberBalance[];
  trend: StatsTrendPoint[];
  isLoading: boolean;
  isEmpty: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodBounds(period: StatsPeriod): { start: Date; end: Date } {
  const now = dayjs();
  if (period === 'day') {
    return {
      start: now.startOf('day').toDate(),
      end: now.endOf('day').toDate(),
    };
  }
  return {
    start: now.startOf('isoWeek').toDate(),
    end: now.endOf('isoWeek').toDate(),
  };
}

type PeriodFilterable = { completed_at: string | null; status: string };

function filterTasksInPeriod<T extends PeriodFilterable>(
  tasks: T[],
  start: Date,
  end: Date,
): T[] {
  return tasks.filter((t) => {
    if (t.status !== 'done' || !t.completed_at) return false;
    const c = dayjs(t.completed_at);
    return !c.isBefore(start) && !c.isAfter(end);
  });
}

/**
 * Derive a CoachLevel from the household score total (0–100).
 * HouseholdScoreResult has no `level` field; we infer it from `total`.
 */
function coachLevelFromScore(
  score: HouseholdScoreResult | null,
  totalTasksInPeriod: number,
): CoachLevel {
  if (totalTasksInPeriod < 3) return 'low-activity';
  if (!score) return 'balanced';
  const t = score.total;
  if (t < 40) return 'unbalanced';
  if (t < 65) return 'watch';
  return 'balanced';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStats(args: {
  scope: StatsScope;
  period: StatsPeriod;
}): StatsResult {
  const { scope, period } = args;

  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const tasksQ = useTasks();
  const balanceQ = useWeeklyBalance();
  const scoreQ = useHouseholdScore();
  const trendsQ = useAnalyticsTrends(4);
  const tlxQ = useCurrentTlx();

  const isLoading =
    !!tasksQ.isLoading ||
    !!balanceQ.isLoading ||
    !!scoreQ.isLoading ||
    !!trendsQ.isLoading ||
    !!tlxQ.isLoading;

  return useMemo<StatsResult>(() => {
    const allTasks = (tasksQ.data as Array<{
      id: string;
      assigned_to: string | null;
      status: string;
      completed_at: string | null;
      due_date: string | null;
      duration_minutes?: number | null;
    }>) ?? [];

    const { start, end } = getPeriodBounds(period);
    const today = new Date();

    const scopedTasks =
      scope === 'me'
        ? allTasks.filter((t) => t.assigned_to === userId)
        : allTasks;

    const tasksInPeriod = filterTasksInPeriod(scopedTasks, start, end);

    const overdueCount = scopedTasks.filter(
      (t) =>
        t.status !== 'done' &&
        t.due_date != null &&
        dayjs(t.due_date).isBefore(today, 'day'),
    ).length;

    // ── KPIs ──────────────────────────────────────────────────────────────────

    let kpis: StatsKpi[];

    if (scope === 'me') {
      const streak = computeStreakDays(allTasks as Parameters<typeof computeStreakDays>[0], userId, today);
      const efficiency = computeEfficiency(
        allTasks as Parameters<typeof computeEfficiency>[0],
        userId,
        start,
        end,
      );
      kpis = [
        { key: 'completed', label: 'Completees', value: tasksInPeriod.length },
        { key: 'streak', label: 'Serie', value: streak, unit: 'j' },
        { key: 'overdue', label: 'Retard', value: overdueCount },
        { key: 'efficiency', label: 'Efficacite', value: efficiency, unit: '%' },
      ];
    } else {
      const totalMinutes = tasksInPeriod.reduce(
        (sum, t) => sum + (t.duration_minutes ?? 0),
        0,
      );
      const maxImbalance =
        balanceQ.members.length > 0
          ? Math.max(...balanceQ.members.map((m) => Math.abs(m.tasksDelta)))
          : 0;
      const balancePct = Math.max(0, Math.round((1 - maxImbalance) * 100));
      kpis = [
        { key: 'completed', label: 'Completees', value: tasksInPeriod.length },
        { key: 'minutes', label: 'Minutes', value: totalMinutes },
        { key: 'overdue', label: 'Retard', value: overdueCount },
        { key: 'balance', label: 'Equilibre', value: balancePct, unit: '%' },
      ];
    }

    // ── Trend ─────────────────────────────────────────────────────────────────

    const trend: StatsTrendPoint[] =
      scope === 'household' && period === 'week'
        ? ((trendsQ.data as Array<{ weekLabel: string; totalTasks: number }>) ?? []).map((w) => ({
            label: w.weekLabel,
            value: w.totalTasks,
          }))
        : [];

    // ── Score & coaching ──────────────────────────────────────────────────────

    const score = scope === 'household' ? (scoreQ.score ?? null) : null;
    const coachMessage =
      scope === 'household'
        ? pickCoachMessage(coachLevelFromScore(score, tasksInPeriod.length))
        : null;

    // ── isEmpty ───────────────────────────────────────────────────────────────

    const isEmpty =
      tasksInPeriod.length === 0 &&
      (scope === 'me' || balanceQ.members.length === 0);

    return {
      scope,
      period,
      score,
      scoreDelta: null, // V1 — previous-period comparison deferred
      coachMessage,
      kpis,
      members: scope === 'household' ? balanceQ.members : [],
      trend,
      isLoading,
      isEmpty,
    };
  }, [scope, period, tasksQ.data, balanceQ.members, scoreQ.score, trendsQ.data, userId, isLoading]);
}
