import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore, useAuthStore } from '@keurzen/stores';
import type { Task, TaskFormValues, TaskStatus } from '@keurzen/shared';
import dayjs from 'dayjs';
import {
  fetchTasks,
  fetchTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  completeTaskWithRating,
  deleteTask,
} from '../services/task.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ['tasks'] as const,
  byHousehold: (householdId: string) => ['tasks', householdId] as const,
  byId: (id: string) => ['tasks', 'detail', id] as const,
  upcoming: (householdId: string) => ['tasks', householdId, 'upcoming'] as const,
  today: (householdId: string) => ['tasks', householdId, 'today'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTasks() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: taskKeys.byHousehold(currentHousehold?.id ?? ''),
    queryFn: () => fetchTasks(currentHousehold!.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30,
  });
}

export function useTaskById(id: string) {
  return useQuery({
    queryKey: taskKeys.byId(id),
    queryFn: () => fetchTaskById(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (values: TaskFormValues) =>
      createTask(values, currentHousehold!.id, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TaskFormValues & { status: TaskStatus; completed_at: string | null }>;
    }) => updateTask(id, updates),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
      qc.invalidateQueries({ queryKey: taskKeys.byId(data.id) });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useCompleteTaskWithRating() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ taskId, rating }: { taskId: string; rating: 1 | 2 | 3 }) =>
      completeTaskWithRating(taskId, rating),
    onSuccess: (_data, variables) => {
      if (currentHousehold) {
        qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold.id) });
      }
      qc.invalidateQueries({ queryKey: taskKeys.byId(variables.taskId) });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Derived hooks ────────────────────────────────────────────────────────────

export function useOverdueTasks() {
  const { data: tasks = [] } = useTasks();
  const now = dayjs();

  return tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.due_date &&
      dayjs(t.due_date).isBefore(now, 'day')
  );
}

export function useTodayTasks() {
  const { data: tasks = [] } = useTasks();
  const today = dayjs().format('YYYY-MM-DD');

  return tasks.filter((t) => t.due_date === today && t.status !== 'done');
}
