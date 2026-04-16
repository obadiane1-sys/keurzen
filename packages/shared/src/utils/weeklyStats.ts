/**
 * Weekly Stats — pure computation functions
 *
 * Extracted from the compute-weekly-stats Edge Function
 * so they can be unit-tested without Supabase.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const IMBALANCE_THRESHOLD = 0.20;
export const MIN_TASKS_SAMPLE = 8;
export const MIN_MINUTES_SAMPLE = 60;

// ─── Types ───────────────────────────────────────────────────────────────────

import type { AlertLevel } from '../types/index';

export interface MemberTaskData {
  userId: string;
  tasksCount: number;
  minutesTotal: number;
}

export interface MemberWeeklyStats {
  userId: string;
  tasksCount: number;
  tasksShare: number;
  tasksDelta: number;
  minutesTotal: number;
  minutesShare: number;
  minutesDelta: number;
  expectedShare: number;
}

export interface WeeklyAggregation {
  totalTasks: number;
  totalMinutes: number;
  members: MemberWeeklyStats[];
}

// ─── Computation ─────────────────────────────────────────────────────────────

/**
 * Compute per-member share and delta for a household week.
 * Pure function — no DB calls.
 */
export function computeWeeklyAggregation(memberData: MemberTaskData[]): WeeklyAggregation {
  const nbMembers = memberData.length;
  if (nbMembers === 0) {
    return { totalTasks: 0, totalMinutes: 0, members: [] };
  }

  const expectedShare = 1 / nbMembers;
  const totalTasks = memberData.reduce((sum, m) => sum + m.tasksCount, 0);
  const totalMinutes = memberData.reduce((sum, m) => sum + m.minutesTotal, 0);

  const members: MemberWeeklyStats[] = memberData.map((m) => {
    const tasksShare = totalTasks > 0 ? m.tasksCount / totalTasks : 0;
    const minutesShare = totalMinutes > 0 ? m.minutesTotal / totalMinutes : 0;

    return {
      userId: m.userId,
      tasksCount: m.tasksCount,
      tasksShare,
      tasksDelta: tasksShare - expectedShare,
      minutesTotal: m.minutesTotal,
      minutesShare,
      minutesDelta: minutesShare - expectedShare,
      expectedShare,
    };
  });

  return { totalTasks, totalMinutes, members };
}

/**
 * Determine imbalance level from a delta value.
 * Requires minimum data thresholds to avoid false alarms.
 */
export function computeImbalanceLevel(
  delta: number,
  totalTasks: number,
  totalMinutes: number,
): AlertLevel {
  if (totalTasks < MIN_TASKS_SAMPLE || totalMinutes < MIN_MINUTES_SAMPLE) {
    return 'balanced';
  }

  const absDelta = Math.abs(delta);
  if (absDelta >= IMBALANCE_THRESHOLD * 1.5) return 'unbalanced';
  if (absDelta >= IMBALANCE_THRESHOLD) return 'watch';
  return 'balanced';
}

/**
 * Compute average TLX score from an array of scores.
 * Excludes null/undefined entries (not counted as 0).
 */
export function computeAverageTlx(scores: (number | null | undefined)[]): number | null {
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, s) => sum + s, 0) / valid.length);
}
