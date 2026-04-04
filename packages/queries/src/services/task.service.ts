import type { Task, TaskFormValues, TaskStatus } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Fetch Tasks ──────────────────────────────────────────────────────────────

export async function fetchTasks(householdId: string): Promise<Task[]> {
  const supabase = getSupabaseClient();

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

// ─── Fetch Task By ID ─────────────────────────────────────────────────────────

export async function fetchTaskById(id: string): Promise<Task> {
  const supabase = getSupabaseClient();

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
}

// ─── Create Task ──────────────────────────────────────────────────────────────

export async function createTask(
  values: TaskFormValues,
  householdId: string,
  userId: string
): Promise<Task> {
  const supabase = getSupabaseClient();

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
      task_type: values.task_type ?? 'household',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Task;
}

// ─── Update Task ──────────────────────────────────────────────────────────────

export async function updateTask(
  id: string,
  updates: Partial<TaskFormValues & { status: TaskStatus; completed_at: string | null }>
): Promise<Task> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Task;
}

// ─── Update Task Status ───────────────────────────────────────────────────────

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const supabase = getSupabaseClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'done') {
    updates.completed_at = new Date().toISOString();
  } else {
    updates.completed_at = null;
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Complete Task With Rating ────────────────────────────────────────────────

export async function completeTaskWithRating(taskId: string, rating: 1 | 2 | 3): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc('complete_task_with_rating', {
    p_task_id: taskId,
    p_rating: rating,
  });

  if (error) throw new Error(error.message);
}

// ─── Delete Task ──────────────────────────────────────────────────────────────

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
