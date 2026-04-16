/**
 * Tests unitaires — Weekly stats aggregation & imbalance
 *
 * Sources:
 * - packages/shared/src/utils/weeklyStats.ts — computeWeeklyAggregation, computeImbalanceLevel, computeAverageTlx
 * - apps/mobile/src/lib/queries/weekly-stats.ts — computeImbalanceLevel (local copy)
 */

import {
  computeWeeklyAggregation,
  computeImbalanceLevel,
  computeAverageTlx,
  IMBALANCE_THRESHOLD,
  MIN_TASKS_SAMPLE,
  MIN_MINUTES_SAMPLE,
} from '@keurzen/shared';
import type { MemberTaskData } from '@keurzen/shared';

// ─── computeWeeklyAggregation ────────────────────────────────────────────────

describe('computeWeeklyAggregation', () => {
  it('returns zeros for empty member list', () => {
    const r = computeWeeklyAggregation([]);
    expect(r).toEqual({ totalTasks: 0, totalMinutes: 0, members: [] });
  });

  it('computes correct shares for 2 members, even split', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 5, minutesTotal: 60 },
      { userId: 'b', tasksCount: 5, minutesTotal: 60 },
    ];
    const r = computeWeeklyAggregation(data);

    expect(r.totalTasks).toBe(10);
    expect(r.totalMinutes).toBe(120);
    expect(r.members).toHaveLength(2);

    for (const m of r.members) {
      expect(m.tasksShare).toBe(0.5);
      expect(m.minutesShare).toBe(0.5);
      expect(m.tasksDelta).toBeCloseTo(0);
      expect(m.minutesDelta).toBeCloseTo(0);
      expect(m.expectedShare).toBe(0.5);
    }
  });

  it('computes correct shares for 2 members, all tasks on one person', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 10, minutesTotal: 120 },
      { userId: 'b', tasksCount: 0, minutesTotal: 0 },
    ];
    const r = computeWeeklyAggregation(data);

    expect(r.totalTasks).toBe(10);
    const memberA = r.members.find((m) => m.userId === 'a')!;
    const memberB = r.members.find((m) => m.userId === 'b')!;

    expect(memberA.tasksShare).toBe(1);
    expect(memberA.tasksDelta).toBeCloseTo(0.5);
    expect(memberB.tasksShare).toBe(0);
    expect(memberB.tasksDelta).toBeCloseTo(-0.5);
  });

  it('computes correct shares for 2 members, 70/30 split', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 7, minutesTotal: 70 },
      { userId: 'b', tasksCount: 3, minutesTotal: 30 },
    ];
    const r = computeWeeklyAggregation(data);

    const memberA = r.members.find((m) => m.userId === 'a')!;
    expect(memberA.tasksShare).toBeCloseTo(0.7);
    expect(memberA.tasksDelta).toBeCloseTo(0.2);
  });

  it('handles single member (solo household)', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 5, minutesTotal: 60 },
    ];
    const r = computeWeeklyAggregation(data);

    expect(r.members[0].tasksShare).toBe(1);
    expect(r.members[0].expectedShare).toBe(1);
    expect(r.members[0].tasksDelta).toBeCloseTo(0); // 1 - 1 = 0
  });

  it('handles 3 members, even split', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 4, minutesTotal: 40 },
      { userId: 'b', tasksCount: 4, minutesTotal: 40 },
      { userId: 'c', tasksCount: 4, minutesTotal: 40 },
    ];
    const r = computeWeeklyAggregation(data);

    for (const m of r.members) {
      expect(m.tasksShare).toBeCloseTo(1 / 3);
      expect(m.tasksDelta).toBeCloseTo(0);
      expect(m.expectedShare).toBeCloseTo(1 / 3);
    }
  });

  it('handles 3 members, one does everything', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 12, minutesTotal: 180 },
      { userId: 'b', tasksCount: 0, minutesTotal: 0 },
      { userId: 'c', tasksCount: 0, minutesTotal: 0 },
    ];
    const r = computeWeeklyAggregation(data);

    const memberA = r.members.find((m) => m.userId === 'a')!;
    expect(memberA.tasksShare).toBe(1);
    expect(memberA.tasksDelta).toBeCloseTo(1 - 1 / 3); // ~0.667
  });

  it('handles 0 total tasks — all shares are 0', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 0, minutesTotal: 0 },
      { userId: 'b', tasksCount: 0, minutesTotal: 0 },
    ];
    const r = computeWeeklyAggregation(data);

    expect(r.totalTasks).toBe(0);
    for (const m of r.members) {
      expect(m.tasksShare).toBe(0);
      expect(m.minutesShare).toBe(0);
      // delta = 0 - 0.5 = -0.5 (each member "owes" their expected share)
      expect(m.tasksDelta).toBeCloseTo(-0.5);
    }
  });

  it('minutes and tasks can have different distributions', () => {
    const data: MemberTaskData[] = [
      { userId: 'a', tasksCount: 8, minutesTotal: 30 },
      { userId: 'b', tasksCount: 2, minutesTotal: 90 },
    ];
    const r = computeWeeklyAggregation(data);

    const memberA = r.members.find((m) => m.userId === 'a')!;
    expect(memberA.tasksShare).toBeCloseTo(0.8);
    expect(memberA.minutesShare).toBeCloseTo(0.25);
    // A does more tasks but less time
    expect(memberA.tasksDelta).toBeGreaterThan(0);
    expect(memberA.minutesDelta).toBeLessThan(0);
  });
});

// ─── computeImbalanceLevel ───────────────────────────────────────────────────

describe('computeImbalanceLevel', () => {
  it('returns balanced when not enough tasks', () => {
    expect(computeImbalanceLevel(0.3, MIN_TASKS_SAMPLE - 1, 120)).toBe('balanced');
  });

  it('returns balanced when not enough minutes', () => {
    expect(computeImbalanceLevel(0.3, 10, MIN_MINUTES_SAMPLE - 1)).toBe('balanced');
  });

  it('returns balanced when both thresholds unmet', () => {
    expect(computeImbalanceLevel(0.3, 3, 30)).toBe('balanced');
  });

  it('returns balanced when delta is small', () => {
    expect(computeImbalanceLevel(0.1, 10, 120)).toBe('balanced');
    expect(computeImbalanceLevel(-0.1, 10, 120)).toBe('balanced');
    expect(computeImbalanceLevel(0.19, 10, 120)).toBe('balanced');
  });

  it('returns watch when delta is at threshold', () => {
    expect(computeImbalanceLevel(0.20, 10, 120)).toBe('watch');
    expect(computeImbalanceLevel(-0.20, 10, 120)).toBe('watch');
  });

  it('returns watch when delta is between threshold and 1.5x', () => {
    expect(computeImbalanceLevel(0.25, 10, 120)).toBe('watch');
    expect(computeImbalanceLevel(-0.29, 10, 120)).toBe('watch');
  });

  it('returns unbalanced when delta > 1.5x threshold', () => {
    // Note: 0.20 * 1.5 = 0.30000000000000004 in JS, so exactly 0.30 is 'watch'
    expect(computeImbalanceLevel(0.31, 10, 120)).toBe('unbalanced');
    expect(computeImbalanceLevel(-0.35, 10, 120)).toBe('unbalanced');
    expect(computeImbalanceLevel(0.50, 10, 120)).toBe('unbalanced');
  });

  it('0.30 exactly is watch due to floating point (0.20*1.5 > 0.30)', () => {
    expect(computeImbalanceLevel(0.30, 10, 120)).toBe('watch');
  });

  it('uses absolute value — sign does not matter', () => {
    expect(computeImbalanceLevel(0.25, 10, 120)).toBe(
      computeImbalanceLevel(-0.25, 10, 120),
    );
    expect(computeImbalanceLevel(0.35, 10, 120)).toBe(
      computeImbalanceLevel(-0.35, 10, 120),
    );
  });

  it('threshold constants are correct', () => {
    expect(IMBALANCE_THRESHOLD).toBe(0.20);
    expect(MIN_TASKS_SAMPLE).toBe(8);
    expect(MIN_MINUTES_SAMPLE).toBe(60);
  });
});

// ─── computeAverageTlx ──────────────────────────────────────────────────────

describe('computeAverageTlx', () => {
  it('returns null for empty array', () => {
    expect(computeAverageTlx([])).toBeNull();
  });

  it('returns null for all-null array', () => {
    expect(computeAverageTlx([null, null, undefined])).toBeNull();
  });

  it('computes average of valid scores', () => {
    expect(computeAverageTlx([40, 60, 80])).toBe(60);
  });

  it('excludes null/undefined from average (not counted as 0)', () => {
    // Average of [40, 80] = 60, not [40, 0, 80] = 40
    expect(computeAverageTlx([40, null, 80])).toBe(60);
    expect(computeAverageTlx([40, undefined, 80])).toBe(60);
  });

  it('handles single score', () => {
    expect(computeAverageTlx([75])).toBe(75);
  });

  it('rounds to nearest integer', () => {
    // (40 + 60 + 70) / 3 = 56.67 -> 57
    expect(computeAverageTlx([40, 60, 70])).toBe(57);
  });

  it('handles all zeros', () => {
    expect(computeAverageTlx([0, 0, 0])).toBe(0);
  });

  it('handles mixed null and single valid', () => {
    expect(computeAverageTlx([null, null, 42])).toBe(42);
  });
});
