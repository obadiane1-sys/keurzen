import type { Alert } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

/**
 * Alerts service — read weekly imbalance alerts produced by the
 * compute-weekly-stats Edge Function, and let members mark them as
 * read. Writes only through UPDATE; creation stays service_role.
 */

export async function fetchAlerts(householdId: string, limit = 50): Promise<Alert[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as Alert[]) ?? [];
}

export async function markAlertAsRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markAllAlertsAsRead(householdId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('alerts')
    .update({ read: true })
    .eq('household_id', householdId)
    .eq('read', false);

  if (error) throw new Error(error.message);
}
