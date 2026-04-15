import { useMemo } from 'react';
import { useTasks } from './useTasks';

export interface RawTask {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export type ActivityKind = 'completed' | 'added';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  taskTitle: string;
  memberId: string | null;
  timestamp: string;
}

export function buildRecentActivity(
  tasks: RawTask[],
  limit: number,
): ActivityItem[] {
  const events: ActivityItem[] = [];

  for (const task of tasks) {
    if (task.status === 'done' && task.completed_at) {
      events.push({
        id: `completed:${task.id}`,
        kind: 'completed',
        taskTitle: task.title,
        memberId: task.assigned_to,
        timestamp: task.completed_at,
      });
    } else if (task.created_at) {
      events.push({
        id: `added:${task.id}`,
        kind: 'added',
        taskTitle: task.title,
        memberId: task.assigned_to,
        timestamp: task.created_at,
      });
    }
  }

  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return events.slice(0, limit);
}

export function useRecentActivity(limit = 5): {
  items: ActivityItem[];
  isLoading: boolean;
} {
  const tasksQ = useTasks();

  const items = useMemo(() => {
    const rawTasks = (tasksQ.data ?? []) as unknown as RawTask[];
    return buildRecentActivity(rawTasks, limit);
  }, [tasksQ.data, limit]);

  return { items, isLoading: !!tasksQ.isLoading };
}
