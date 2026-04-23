import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import type { TimeLog } from '@keurzen/shared';
import {
  fetchTaskTimeLogs,
  addTimeLog,
  deleteTimeLog,
  type AddTimeLogInput,
} from '../services/timeLog.service';

export const timeLogKeys = {
  all: () => ['time-logs'] as const,
  byTask: (taskId: string) => ['time-logs', taskId] as const,
};

export function useTaskTimeLogs(taskId: string | undefined) {
  return useQuery<TimeLog[]>({
    queryKey: timeLogKeys.byTask(taskId ?? ''),
    queryFn: () => fetchTaskTimeLogs(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useAddTimeLog() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (input: Omit<AddTimeLogInput, 'householdId'>) => {
      if (!user) throw new Error('Non authentifie');
      if (!currentHousehold) throw new Error('Aucun foyer selectionne');
      return addTimeLog(user.id, {
        ...input,
        householdId: currentHousehold.id,
      });
    },
    onSuccess: (timeLog) => {
      qc.invalidateQueries({ queryKey: timeLogKeys.byTask(timeLog.task_id) });
      // Parent task fetch embeds time_logs(*), refresh it too.
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTimeLog(taskId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTimeLog(id),
    onSuccess: () => {
      if (taskId) {
        qc.invalidateQueries({ queryKey: timeLogKeys.byTask(taskId) });
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
