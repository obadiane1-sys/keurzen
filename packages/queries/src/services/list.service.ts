import type {
  SharedList,
  SharedListItem,
  SharedListFormValues,
  SharedListItemFormValues,
} from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Fetch Lists ──────────────────────────────────────────────────────────────

export async function fetchLists(householdId: string): Promise<SharedList[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('shared_lists')
    .select('*')
    .eq('household_id', householdId)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SharedList[]) ?? [];
}

// ─── Fetch List By ID ─────────────────────────────────────────────────────────

export async function fetchListById(id: string): Promise<SharedList> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('shared_lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as SharedList;
}

// ─── Create List ──────────────────────────────────────────────────────────────

export async function createList(
  values: SharedListFormValues,
  householdId: string,
  userId: string
): Promise<SharedList> {
  const supabase = getSupabaseClient();

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

// ─── Update List ──────────────────────────────────────────────────────────────

export async function updateList(
  id: string,
  updates: Partial<Pick<SharedList, 'title' | 'icon' | 'color' | 'archived'>>
): Promise<SharedList> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('shared_lists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SharedList;
}

// ─── Delete List ──────────────────────────────────────────────────────────────

export async function deleteList(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('shared_lists').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Fetch List Items ─────────────────────────────────────────────────────────

export async function fetchListItems(listId: string): Promise<SharedListItem[]> {
  const supabase = getSupabaseClient();

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

// ─── Add List Item ────────────────────────────────────────────────────────────

export async function addListItem(
  listId: string,
  values: SharedListItemFormValues,
  userId: string
): Promise<SharedListItem> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('shared_list_items')
    .insert({
      list_id: listId,
      title: values.title,
      quantity: values.quantity || null,
      category: values.category || null,
      assigned_to: values.assigned_to || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SharedListItem;
}

// ─── Toggle List Item ─────────────────────────────────────────────────────────

export async function toggleListItem(
  itemId: string,
  checked: boolean,
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const updates = checked
    ? {
        checked: true,
        checked_by: userId,
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
}

// ─── Update List Item ─────────────────────────────────────────────────────────

export async function updateListItem(
  itemId: string,
  data: Partial<SharedListItemFormValues & { position: number }>
): Promise<SharedListItem> {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('shared_list_items')
    .update(data)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as SharedListItem;
}

// ─── Delete List Item ─────────────────────────────────────────────────────────

export async function deleteListItem(itemId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('shared_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(error.message);
}
