import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore, useAuthStore } from '@keurzen/stores';
import type {
  SharedList,
  SharedListFormValues,
  SharedListItemFormValues,
} from '@keurzen/shared';
import {
  fetchLists,
  fetchListById,
  createList,
  updateList,
  deleteList,
  fetchListItems,
  addListItem,
  toggleListItem,
  updateListItem,
  deleteListItem,
} from '../services/list.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const listKeys = {
  all: ['lists'] as const,
  byHousehold: (householdId: string) => ['lists', householdId] as const,
  byId: (id: string) => ['lists', 'detail', id] as const,
  items: (listId: string) => ['lists', 'items', listId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLists() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: listKeys.byHousehold(currentHousehold?.id ?? ''),
    queryFn: () => fetchLists(currentHousehold!.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30,
  });
}

export function useListById(id: string) {
  return useQuery({
    queryKey: listKeys.byId(id),
    queryFn: () => fetchListById(id),
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (values: SharedListFormValues) =>
      createList(values, currentHousehold!.id, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<SharedList, 'title' | 'icon' | 'color' | 'archived'>>;
    }) => updateList(id, updates),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
      qc.invalidateQueries({ queryKey: listKeys.byId(data.id) });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useListItems(listId: string) {
  return useQuery({
    queryKey: listKeys.items(listId),
    queryFn: () => fetchListItems(listId),
    enabled: !!listId,
    staleTime: 1000 * 30,
  });
}

export function useAddListItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      listId,
      values,
    }: {
      listId: string;
      values: SharedListItemFormValues;
    }) => addListItem(listId, values, user!.id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useToggleListItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      itemId,
      checked,
    }: {
      itemId: string;
      listId: string;
      checked: boolean;
    }) => toggleListItem(itemId, checked, user!.id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

export function useUpdateListItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      listId: string;
      data: Partial<SharedListItemFormValues & { position: number }>;
    }) => updateListItem(itemId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
    },
  });
}

export function useDeleteListItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string; listId: string }) =>
      deleteListItem(itemId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}
