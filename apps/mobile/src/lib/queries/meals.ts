import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import { listKeys } from './lists';
import { taskKeys } from './tasks';
import type {
  MealPlanItem,
  MealPlanFormValues,
  Ingredient,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const mealKeys = {
  all: ['meals'] as const,
  plan: (householdId: string, weekStart: string) =>
    ['meals', 'plan', householdId, weekStart] as const,
  history: (householdId: string) => ['meals', 'history', householdId] as const,
};

// ─── Fetch Meal Plan (week) ──────────────────────────────────────────────────

async function fetchMealPlan(
  householdId: string,
  weekStart: string
): Promise<MealPlanItem[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_plan_items')
    .select(`
      *,
      recipe:recipes(id, title, description, image_url, prep_time, cook_time, servings, difficulty, tags),
      assigned_profile:profiles!meal_plan_items_assigned_to_fkey(id, full_name, avatar_url)
    `)
    .eq('household_id', householdId)
    .gte('date', weekStart)
    .lte('date', weekEndStr)
    .order('date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as MealPlanItem[]) ?? [];
}

export function useMealPlan(weekStart: string) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: mealKeys.plan(currentHousehold?.id ?? '', weekStart),
    queryFn: () => fetchMealPlan(currentHousehold!.id, weekStart),
    enabled: !!currentHousehold?.id && !!weekStart,
    staleTime: 1000 * 30,
  });
}

// ─── Create Meal Plan Item ───────────────────────────────────────────────────

export function useCreateMealPlanItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (values: MealPlanFormValues) => {
      const householdId = currentHousehold!.id;
      const userId = user!.id;

      // 1. Fetch recipe for task title and time estimate
      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .select('title, prep_time, cook_time')
        .eq('id', values.recipe_id)
        .single();
      if (recipeErr) throw new Error(recipeErr.message);

      // 2. Create household task
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          household_id: householdId,
          title: `Cuisiner : ${recipe.title}`,
          task_type: 'household',
          category: 'cooking',
          assigned_to: values.assigned_to || null,
          due_date: values.date,
          estimated_minutes: recipe.prep_time + recipe.cook_time,
          status: 'todo',
          priority: 'medium',
          zone: 'kitchen',
          recurrence: 'none',
          created_by: userId,
        })
        .select('id')
        .single();
      if (taskErr) throw new Error(taskErr.message);

      // 3. Create meal_plan_item
      const { data: item, error: itemErr } = await supabase
        .from('meal_plan_items')
        .insert({
          household_id: householdId,
          recipe_id: values.recipe_id,
          date: values.date,
          meal_type: values.meal_type,
          servings: values.servings,
          assigned_to: values.assigned_to || null,
          task_id: task.id,
          created_by: userId,
        })
        .select()
        .single();
      if (itemErr) throw new Error(itemErr.message);

      // 4. Add ingredients to active grocery list
      await addIngredientsToGroceryList(
        householdId,
        userId,
        values.recipe_id,
        values.servings
      );

      return item as MealPlanItem;
    },
    onSuccess: () => {
      const householdId = currentHousehold!.id;
      qc.invalidateQueries({ queryKey: mealKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(householdId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(householdId) });
    },
  });
}

// ─── Delete Meal Plan Item ───────────────────────────────────────────────────

export function useDeleteMealPlanItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
    }: {
      id: string;
      taskId: string | null;
    }) => {
      const { error: itemErr } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('id', id);
      if (itemErr) throw new Error(itemErr.message);

      if (taskId) {
        const { data: task } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', taskId)
          .single();

        if (task && task.status !== 'done') {
          await supabase.from('tasks').delete().eq('id', taskId);
        }
      }
    },
    onSuccess: () => {
      const householdId = currentHousehold!.id;
      qc.invalidateQueries({ queryKey: mealKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(householdId) });
    },
  });
}

// ─── Meal History & Suggestions ──────────────────────────────────────────────

export function useMealHistory(months: number = 3) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: mealKeys.history(currentHousehold?.id ?? ''),
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const sinceStr = since.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meal_plan_items')
        .select(`
          id, date, meal_type, recipe_id,
          recipe:recipes(id, title, image_url, prep_time, cook_time, servings, difficulty, tags)
        `)
        .eq('household_id', currentHousehold!.id)
        .gte('date', sinceStr)
        .order('date', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as MealPlanItem[]) ?? [];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Generate Grocery List ───────────────────────────────────────────────────

interface GenerateGroceryListParams {
  startDate: string;
  endDate: string;
  mergeWithExisting: boolean;
  excludeBasics: boolean;
}

export function useGenerateGroceryList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (params: GenerateGroceryListParams) => {
      const householdId = currentHousehold!.id;
      const userId = user!.id;

      // 1. Fetch all meal_plan_items in date range
      const { data: items, error: itemsErr } = await supabase
        .from('meal_plan_items')
        .select('recipe_id, servings')
        .eq('household_id', householdId)
        .gte('date', params.startDate)
        .lte('date', params.endDate);

      if (itemsErr) throw new Error(itemsErr.message);
      if (!items || items.length === 0) throw new Error('Aucun repas planifié sur cette période.');

      // 2. Fetch recipe ingredients for all recipes
      const recipeIds = [...new Set(items.map((i) => i.recipe_id))];
      const { data: recipeIngs, error: ingsErr } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe_id, quantity, unit, optional, note,
          ingredient:ingredients(id, name, category, default_unit)
        `)
        .in('recipe_id', recipeIds);

      if (ingsErr) throw new Error(ingsErr.message);

      // 3. Build recipe servings map
      const { data: recipeMeta } = await supabase
        .from('recipes')
        .select('id, servings')
        .in('id', recipeIds);

      const recipeServingsMap = new Map(
        (recipeMeta ?? []).map((r: { id: string; servings: number }) => [r.id, r.servings])
      );

      // 4. Aggregate ingredients across all meals
      const aggregated = new Map<
        string,
        { name: string; category: string; quantity: number; unit: string }
      >();

      for (const item of items) {
        const defaultServings = recipeServingsMap.get(item.recipe_id) ?? 4;
        const ratio = item.servings / defaultServings;

        const recipeIngredients = (recipeIngs ?? []).filter(
          (ri: { recipe_id: string }) => ri.recipe_id === item.recipe_id
        );

        for (const ri of recipeIngredients) {
          const ing = (ri as { ingredient: Ingredient }).ingredient;
          if (!ing) continue;
          if (params.excludeBasics && (ri as { optional: boolean }).optional) continue;

          const key = `${ing.id}-${(ri as { unit: string }).unit}`;
          const existing = aggregated.get(key);
          const adjustedQty = (ri as { quantity: number }).quantity * ratio;

          if (existing) {
            existing.quantity += adjustedQty;
          } else {
            aggregated.set(key, {
              name: ing.name,
              category: ing.category,
              quantity: adjustedQty,
              unit: (ri as { unit: string }).unit,
            });
          }
        }
      }

      // 5. Create or find existing grocery list
      let listId: string;

      if (params.mergeWithExisting) {
        const { data: existingLists } = await supabase
          .from('shared_lists')
          .select('id')
          .eq('household_id', householdId)
          .eq('type', 'shopping')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (existingLists && existingLists.length > 0) {
          listId = existingLists[0].id;
        } else {
          const { data: newList, error: listErr } = await supabase
            .from('shared_lists')
            .insert({
              household_id: householdId,
              title: 'Courses semaine',
              type: 'shopping',
              created_by: userId,
            })
            .select('id')
            .single();
          if (listErr) throw new Error(listErr.message);
          listId = newList.id;
        }
      } else {
        const { data: newList, error: listErr } = await supabase
          .from('shared_lists')
          .insert({
            household_id: householdId,
            title: 'Courses semaine',
            type: 'shopping',
            created_by: userId,
          })
          .select('id')
          .single();
        if (listErr) throw new Error(listErr.message);
        listId = newList.id;
      }

      // 6. Insert aggregated items
      const listItems = [...aggregated.values()].map((item, index) => ({
        list_id: listId,
        title: item.name,
        quantity: `${Math.round(item.quantity * 10) / 10}${item.unit}`,
        category: item.category,
        position: index,
        created_by: userId,
      }));

      if (listItems.length > 0) {
        const { error: insertErr } = await supabase
          .from('shared_list_items')
          .insert(listItems);
        if (insertErr) throw new Error(insertErr.message);
      }

      return listId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Helper: Add recipe ingredients to active grocery list ───────────────────

async function addIngredientsToGroceryList(
  householdId: string,
  userId: string,
  recipeId: string,
  servings: number
) {
  const { data: recipeIngs } = await supabase
    .from('recipe_ingredients')
    .select(`
      quantity, unit, optional,
      ingredient:ingredients(id, name, category)
    `)
    .eq('recipe_id', recipeId);

  if (!recipeIngs || recipeIngs.length === 0) return;

  const { data: recipe } = await supabase
    .from('recipes')
    .select('servings')
    .eq('id', recipeId)
    .single();

  const ratio = servings / (recipe?.servings ?? 4);

  const { data: existingLists } = await supabase
    .from('shared_lists')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', 'shopping')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(1);

  let listId: string;
  if (existingLists && existingLists.length > 0) {
    listId = existingLists[0].id;
  } else {
    const { data: newList, error } = await supabase
      .from('shared_lists')
      .insert({
        household_id: householdId,
        title: 'Courses',
        type: 'shopping',
        created_by: userId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    listId = newList.id;
  }

  const items = recipeIngs
    .filter((ri) => !(ri as { optional: boolean }).optional)
    .map((ri, index) => {
      const ing = (ri as { ingredient: { id: string; name: string; category: string } }).ingredient;
      const qty = (ri as { quantity: number }).quantity * ratio;
      return {
        list_id: listId,
        title: ing.name,
        quantity: `${Math.round(qty * 10) / 10}${(ri as { unit: string }).unit}`,
        category: ing.category,
        position: index,
        created_by: userId,
      };
    });

  if (items.length > 0) {
    await supabase.from('shared_list_items').insert(items);
  }
}
