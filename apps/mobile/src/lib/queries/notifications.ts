import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import type { InAppNotification } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread', userId] as const,
};

// ─── Fetch Notifications ─────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificationKeys.all(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data as unknown as InAppNotification[]) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });
}

// ─── Unread Count ────────────────────────────────────────────────────────────

export function useUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificationKeys.unreadCount(user?.id ?? ''),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false);

      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 60, // Poll every 60s
  });
}

// ─── Mark as Read ────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: notificationKeys.all(user.id) });
        qc.invalidateQueries({ queryKey: notificationKeys.unreadCount(user.id) });
      }
    },
  });
}

// ─── Mark All as Read ────────────────────────────────────────────────────────

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: notificationKeys.all(user.id) });
        qc.invalidateQueries({ queryKey: notificationKeys.unreadCount(user.id) });
      }
    },
  });
}
