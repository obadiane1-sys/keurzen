import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import type { NotificationPreference } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notifPrefKeys = {
  prefs: (userId: string) => ['notification-preferences', userId] as const,
};

// ─── Fetch Preferences ───────────────────────────────────────────────────────

export function useNotificationPreferences() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notifPrefKeys.prefs(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No row found — create default preferences
        const { data: created, error: createError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user!.id })
          .select()
          .single();

        if (createError) throw new Error(createError.message);
        return created as unknown as NotificationPreference;
      }

      if (error) throw new Error(error.message);
      return data as unknown as NotificationPreference;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Update Preferences ─────────────────────────────────────────────────────

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user!.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: notifPrefKeys.prefs(user.id) });
      }
    },
  });
}
