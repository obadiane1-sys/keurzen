import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../stores/auth.store';
import type { TourPage, TourSeen, TourSlide } from '../types';

const CURRENT_TOUR_VERSION = 1;

export const tourKeys = {
  slides: (page: TourPage) => ['tour', 'slides', page] as const,
  seen: (userId: string) => ['tour', 'seen', userId] as const,
};

/**
 * Vérifie si l'utilisateur a déjà vu le tour d'une page.
 */
export function useTourSeen(page: TourPage) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...tourKeys.seen(user?.id ?? ''), page],
    queryFn: async () => {
      const { data } = await supabase
        .from('tour_seen')
        .select('*')
        .eq('user_id', user!.id)
        .eq('page', page)
        .eq('version', CURRENT_TOUR_VERSION)
        .maybeSingle();

      return data as TourSeen | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Récupère les slides d'un tour pour une page donnée.
 */
export function useTourSlides(page: TourPage) {
  return useQuery({
    queryKey: tourKeys.slides(page),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_slides')
        .select('*')
        .eq('page', page)
        .eq('version', CURRENT_TOUR_VERSION)
        .order('order', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as TourSlide[]) ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Marque un tour comme vu.
 */
export function useMarkTourSeen(page: TourPage) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tour_seen').upsert(
        {
          user_id: user!.id,
          page,
          version: CURRENT_TOUR_VERSION,
        },
        { onConflict: 'user_id,page,version' }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tourKeys.seen(user!.id) });
    },
  });
}
