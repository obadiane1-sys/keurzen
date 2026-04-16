import {
  computeStreakDays,
  computeEfficiency,
  pickCoachMessage,
  computeScoreDelta,
} from './statsHelpers';

const USER = 'u1';

function task(opts: Partial<{ completed_at: string | null; assigned_to: string | null; status: string; due_date: string | null }>) {
  return {
    completed_at: null,
    assigned_to: USER,
    status: 'done',
    due_date: null,
    ...opts,
  };
}

describe('computeStreakDays', () => {
  const today = new Date('2026-04-14T12:00:00Z');

  it('returns 0 when user has no completed tasks', () => {
    expect(computeStreakDays([], USER, today)).toBe(0);
  });

  it('returns 1 when user completed a task today', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z' })];
    expect(computeStreakDays(tasks, USER, today)).toBe(1);
  });

  it('counts 3 consecutive days ending today', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z' }),
      task({ completed_at: '2026-04-13T09:00:00Z' }),
      task({ completed_at: '2026-04-12T09:00:00Z' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(3);
  });

  it('breaks streak on a missing day', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z' }),
      task({ completed_at: '2026-04-12T09:00:00Z' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(1);
  });

  it('ignores tasks from other users', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', assigned_to: 'other' }),
    ];
    expect(computeStreakDays(tasks, USER, today)).toBe(0);
  });

  it('ignores tasks not done', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z', status: 'todo' })];
    expect(computeStreakDays(tasks, USER, today)).toBe(0);
  });
});

describe('computeEfficiency', () => {
  const start = new Date('2026-04-13T00:00:00Z');
  const end = new Date('2026-04-19T23:59:59Z');

  it('returns 0 when no tasks in period', () => {
    expect(computeEfficiency([], USER, start, end)).toBe(0);
  });

  it('returns 100 when every task is completed on time', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', due_date: '2026-04-15' }),
      task({ completed_at: '2026-04-16T09:00:00Z', due_date: '2026-04-16' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(100);
  });

  it('returns 50 when half the tasks are late', () => {
    const tasks = [
      task({ completed_at: '2026-04-14T09:00:00Z', due_date: '2026-04-15' }),
      task({ completed_at: '2026-04-18T09:00:00Z', due_date: '2026-04-16' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(50);
  });

  it('ignores tasks outside the period', () => {
    const tasks = [
      task({ completed_at: '2026-04-10T09:00:00Z', due_date: '2026-04-10' }),
    ];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(0);
  });

  it('counts a task without a due date as on time', () => {
    const tasks = [task({ completed_at: '2026-04-14T09:00:00Z', due_date: null })];
    expect(computeEfficiency(tasks, USER, start, end)).toBe(100);
  });
});

describe('pickCoachMessage', () => {
  it('returns a non-empty French string for each level', () => {
    for (const level of ['balanced', 'watch', 'unbalanced', 'low-activity'] as const) {
      const msg = pickCoachMessage(level);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('returns different messages for different levels', () => {
    const b = pickCoachMessage('balanced');
    const u = pickCoachMessage('unbalanced');
    expect(b).not.toBe(u);
  });
});

describe('computeScoreDelta', () => {
  it('returns 0 when previous is 0', () => {
    expect(computeScoreDelta(80, 0)).toBe(0);
  });

  it('returns positive percentage when score increased', () => {
    expect(computeScoreDelta(84, 80)).toBe(5);
  });

  it('returns negative when score decreased', () => {
    expect(computeScoreDelta(76, 80)).toBe(-5);
  });

  it('rounds to integer', () => {
    expect(computeScoreDelta(81, 80)).toBe(1);
  });
});
