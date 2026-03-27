import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import type { Task, TaskFormValues, TaskStatus } from '../../types';
import dayjs from 'dayjs';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ['tasks'] as const,
  byHousehold: (householdId: string) => ['tasks', householdId] as const,
  byId: (id: string) => ['tasks', 'detail', id] as const,
  upcoming: (householdId: string) => ['tasks', householdId, 'upcoming'] as const,
  today: (householdId: string) => ['tasks', householdId, 'today'] as const,
};

// ─── Fetch Tasks ──────────────────────────────────────────────────────────────

async function fetchTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      time_logs(*)
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Task[]) ?? [];
}

export function useTasks() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: taskKeys.byHousehold(currentHousehold?.id ?? ''),
    queryFn: () => fetchTasks(currentHousehold!.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useTaskById(id: string) {
  return useQuery({
    queryKey: taskKeys.byId(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
          time_logs(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as Task;
    },
    enabled: !!id,
  });
}

// ─── Create Task ──────────────────────────────────────────────────────────────

async function createTask(
  values: TaskFormValues,
  householdId: string,
  userId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...values,
      household_id: householdId,
      created_by: userId,
      status: 'todo',
      assigned_to: values.assigned_to || null,
      due_date: values.due_date || null,
      description: values.description || null,
      estimated_minutes: values.estimated_minutes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Task;
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

// ─── Update Task ──────────────────────────────────────────────────────────────

export function useUpdateTask() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskFormValues & { status: TaskStatus; completed_at: string | null }> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Task;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
      qc.invalidateQueries({ queryKey: taskKeys.byId(data.id) });
    },
  });
}

// ─── Update Task Status ───────────────────────────────────────────────────────

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'done') {
        updates.completed_at = new Date().toISOString();
      } else if (status !== 'done') {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Delete Task ──────────────────────────────────────────────────────────────

export function useDeleteTask() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
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

  return tasks.filter(
    (t) => t.due_date === today && t.status !== 'done'
  );
}
