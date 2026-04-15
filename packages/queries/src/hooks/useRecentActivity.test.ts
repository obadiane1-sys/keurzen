import { describe, expect, it } from '@jest/globals';
import { buildRecentActivity, type RawTask } from './useRecentActivity';

describe('buildRecentActivity', () => {
  const t1: RawTask = {
    id: 't1',
    title: 'Lessive',
    status: 'done',
    assigned_to: 'user-a',
    completed_at: '2026-04-15T10:00:00Z',
    created_at: '2026-04-14T08:00:00Z',
  };
  const t2: RawTask = {
    id: 't2',
    title: 'Courses Monoprix',
    status: 'todo',
    assigned_to: 'user-b',
    completed_at: null,
    created_at: '2026-04-15T09:00:00Z',
  };
  const t3: RawTask = {
    id: 't3',
    title: 'Ranger chambre',
    status: 'done',
    assigned_to: 'user-c',
    completed_at: '2026-04-15T07:00:00Z',
    created_at: '2026-04-10T06:00:00Z',
  };

  it('returns newest events first, mixing completions and additions', () => {
    const items = buildRecentActivity([t1, t2, t3], 3);
    expect(items.map((i) => i.id)).toEqual([
      'completed:t1',
      'added:t2',
      'completed:t3',
    ]);
    expect(items[0]).toMatchObject({
      kind: 'completed',
      taskTitle: 'Lessive',
      memberId: 'user-a',
    });
    expect(items[1]).toMatchObject({
      kind: 'added',
      taskTitle: 'Courses Monoprix',
      memberId: 'user-b',
    });
  });

  it('caps the list at the requested limit', () => {
    const items = buildRecentActivity([t1, t2, t3], 2);
    expect(items).toHaveLength(2);
  });

  it('ignores tasks with neither completion nor creation timestamp', () => {
    const broken: RawTask = {
      id: 'x',
      title: '?',
      status: 'todo',
      assigned_to: null,
      completed_at: null,
      created_at: null,
    };
    expect(buildRecentActivity([broken], 5)).toEqual([]);
  });
});
