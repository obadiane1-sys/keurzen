import type { TimeLog } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

/**
 * Time tracking service — add, list and remove time log entries
 * attached to a task. Rows are owned by the current user via RLS.
 */

export async function fetchTaskTimeLogs(taskId: string): Promise<TimeLog[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('time_logs')
    .select('*, profile:profiles(*)')
    .eq('task_id', taskId)
    .order('logged_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as TimeLog[]) ?? [];
}

export interface AddTimeLogInput {
  taskId: string;
  householdId: string;
  minutes: number;
  note?: string;
}

export async function addTimeLog(
  userId: string,
  input: AddTimeLogInput,
): Promise<TimeLog> {
  const supabase = getSupabaseClient();

  if (!Number.isFinite(input.minutes) || input.minutes <= 0) {
    throw new Error('Durée invalide : entrez un nombre de minutes positif.');
  }

  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      task_id: input.taskId,
      household_id: input.householdId,
      user_id: userId,
      minutes: Math.round(input.minutes),
      note: input.note?.trim() || null,
    })
    .select('*, profile:profiles(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as TimeLog;
}

export async function deleteTimeLog(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('time_logs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
