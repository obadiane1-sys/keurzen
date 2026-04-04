import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import type {
  SharedList,
  SharedListItem,
  SharedListFormValues,
  SharedListItemFormValues,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const listKeys = {
  all: ['lists'] as const,
  byHousehold: (householdId: string) => ['lists', householdId] as const,
  byId: (id: string) => ['lists', 'detail', id] as const,
  items: (listId: string) => ['lists', 'items', listId] as const,
};

// ─── Fetch Lists ──────────────────────────────────────────────────────────────

async function fetchLists(householdId: string): Promise<SharedList[]> {
  const { data, error } = await supabase
    .from('shared_lists')
    .select('*')
    .eq('household_id', householdId)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SharedList[]) ?? [];
}

export function useLists() {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: listKeys.byHousehold(currentHousehold?.id ?? ''),
    queryFn: () => fetchLists(currentHousehold!.id),
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ─── Fetch List By ID ─────────────────────────────────────────────────────────

export function useListById(id: string) {
  return useQuery({
    queryKey: listKeys.byId(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as SharedList;
    },
    enabled: !!id,
  });
}

// ─── Create List ──────────────────────────────────────────────────────────────

async function createList(
  values: SharedListFormValues,
  householdId: string,
  userId: string
): Promise<SharedList> {
  const { data, error } = await supabase
    .from('shared_lists')
    .insert({
      title: values.title,
      type: values.type,
      icon: values.icon || null,
      color: values.color || null,
      household_id: householdId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SharedList;
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

// ─── Update List ──────────────────────────────────────────────────────────────

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
    }) => {
      const { data, error } = await supabase
        .from('shared_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as SharedList;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
      qc.invalidateQueries({ queryKey: listKeys.byId(data.id) });
    },
  });
}

// ─── Delete List ──────────────────────────────────────────────────────────────

export function useDeleteList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shared_lists').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Fetch List Items ─────────────────────────────────────────────────────────

async function fetchListItems(listId: string): Promise<SharedListItem[]> {
  const { data, error } = await supabase
    .from('shared_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('checked', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as SharedListItem[]) ?? [];
}

export function useListItems(listId: string) {
  return useQuery({
    queryKey: listKeys.items(listId),
    queryFn: () => fetchListItems(listId),
    enabled: !!listId,
    staleTime: 1000 * 30,
  });
}

// ─── Add List Item ────────────────────────────────────────────────────────────

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
    }) => {
      const { data, error } = await supabase
        .from('shared_list_items')
        .insert({
          list_id: listId,
          title: values.title,
          quantity: values.quantity || null,
          category: values.category || null,
          assigned_to: values.assigned_to || null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SharedListItem;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Toggle List Item ─────────────────────────────────────────────────────────

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
    }) => {
      const updates = checked
        ? {
            checked: true,
            checked_by: user!.id,
            checked_at: new Date().toISOString(),
          }
        : {
            checked: false,
            checked_by: null,
            checked_at: null,
          };

      const { error } = await supabase
        .from('shared_list_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Update List Item ─────────────────────────────────────────────────────────

export function useUpdateListItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data: updateData,
    }: {
      itemId: string;
      listId: string;
      data: Partial<SharedListItemFormValues & { position: number }>;
    }) => {
      const { data, error } = await supabase
        .from('shared_list_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SharedListItem;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
    },
  });
}

// ─── Delete List Item ─────────────────────────────────────────────────────────

export function useDeleteListItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string; listId: string }) => {
      const { error } = await supabase
        .from('shared_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: listKeys.items(variables.listId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}
