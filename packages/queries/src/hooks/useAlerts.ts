import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@keurzen/stores';
import type { Alert } from '@keurzen/shared';
import {
  fetchAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
} from '../services/alert.service';

export const alertKeys = {
  all: (householdId: string) => ['alerts', householdId] as const,
};

export function useAlerts(limit = 50) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery<Alert[]>({
    queryKey: alertKeys.all(currentHousehold?.id ?? ''),
    queryFn: () => fetchAlerts(currentHousehold!.id, limit),
    enabled: !!currentHousehold?.id,
    staleTime: 60 * 1000,
  });
}

export function useUnreadAlertsCount(): number {
  const { data: alerts = [] } = useAlerts();
  return alerts.filter((a) => !a.read).length;
}

export function useMarkAlertAsRead() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: (id: string) => markAlertAsRead(id),
    onSuccess: () => {
      if (currentHousehold) {
        qc.invalidateQueries({ queryKey: alertKeys.all(currentHousehold.id) });
      }
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async () => {
      if (!currentHousehold) throw new Error('Aucun foyer selectionne');
      await markAllAlertsAsRead(currentHousehold.id);
    },
    onSuccess: () => {
      if (currentHousehold) {
        qc.invalidateQueries({ queryKey: alertKeys.all(currentHousehold.id) });
      }
    },
  });
}
