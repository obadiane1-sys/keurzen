import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import type {
  Recipe,
  RecipeIngredient,
  Ingredient,
  RecipeFavorite,
  RecipeFormValues,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const recipeKeys = {
  all: ['recipes'] as const,
  catalog: (householdId: string) => ['recipes', 'catalog', householdId] as const,
  byId: (id: string) => ['recipes', 'detail', id] as const,
  favorites: (userId: string) => ['recipes', 'favorites', userId] as const,
  ingredientSearch: (query: string) => ['ingredients', 'search', query] as const,
};

// ─── Fetch Recipes (catalog) ─────────────────────────────────────────────────

interface RecipeFilters {
  search?: string;
  tags?: string[];
  difficulty?: string;
  maxTime?: number;
  source?: 'system' | 'user';
}

async function fetchRecipes(
  householdId: string,
  userId: string,
  filters?: RecipeFilters
): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('*')
    .or(`source.eq.system,household_id.eq.${householdId}`)
    .order('title', { ascending: true });

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let recipes = (data as Recipe[]) ?? [];

  if (filters?.maxTime) {
    recipes = recipes.filter(
      (r) => r.prep_time + r.cook_time <= filters.maxTime!
    );
  }

  const { data: favs } = await supabase
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('user_id', userId);

  const favSet = new Set((favs ?? []).map((f: { recipe_id: string }) => f.recipe_id));
  return recipes.map((r) => ({ ...r, is_favorite: favSet.has(r.id) }));
}

export function useRecipes(filters?: RecipeFilters) {
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...recipeKeys.catalog(currentHousehold?.id ?? ''), filters],
    queryFn: () => fetchRecipes(currentHousehold!.id, user!.id, filters),
    enabled: !!currentHousehold?.id && !!user?.id,
    staleTime: 1000 * 60,
  });
}

// ─── Fetch Recipe by ID (with ingredients) ───────────────────────────────────

async function fetchRecipe(id: string, userId: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, recipe_id, ingredient_id, quantity, unit, optional, note,
        ingredient:ingredients(id, name, category, default_unit)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const { data: fav } = await supabase
    .from('recipe_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', id)
    .maybeSingle();

  return { ...(data as Recipe), is_favorite: !!fav };
}

export function useRecipe(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: recipeKeys.byId(id),
    queryFn: () => fetchRecipe(id, user!.id),
    enabled: !!id && !!user?.id,
  });
}

// ─── Create Recipe ───────────────────────────────────────────────────────────

export function useCreateRecipe() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          household_id: currentHousehold!.id,
          title: values.title,
          description: values.description || null,
          prep_time: values.prep_time,
          cook_time: values.cook_time,
          servings: values.servings,
          difficulty: values.difficulty,
          tags: values.tags,
          steps: values.steps,
          source: 'user' as const,
          created_by: user!.id,
        })
        .select()
        .single();

      if (recipeError) throw new Error(recipeError.message);

      if (values.ingredients.length > 0) {
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            values.ingredients.map((ing) => ({
              recipe_id: recipe.id,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit,
              optional: ing.optional,
              note: ing.note || null,
            }))
          );
        if (ingError) throw new Error(ingError.message);
      }

      return recipe as Recipe;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.catalog(currentHousehold!.id) });
    },
  });
}

// ─── Toggle Favorite ─────────────────────────────────────────────────────────

export function useToggleFavorite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      recipeId,
      isFavorite,
    }: {
      recipeId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('recipe_favorites')
          .delete()
          .eq('user_id', user!.id)
          .eq('recipe_id', recipeId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('recipe_favorites')
          .insert({ user_id: user!.id, recipe_id: recipeId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.byId(recipeId) });
      qc.invalidateQueries({ queryKey: recipeKeys.favorites(user!.id) });
      qc.invalidateQueries({ queryKey: recipeKeys.catalog(currentHousehold!.id) });
    },
  });
}

// ─── Favorite Recipes ────────────────────────────────────────────────────────

export function useFavoriteRecipes() {
  const user = useAuthStore((s) => s.user);
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: recipeKeys.favorites(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select(`
          id, created_at,
          recipe:recipes(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((f) => ({
        ...(f.recipe as unknown as Recipe),
        is_favorite: true,
      })) as Recipe[];
    },
    enabled: !!user?.id && !!currentHousehold?.id,
  });
}

// ─── Ingredient Search (autocomplete) ────────────────────────────────────────

export function useIngredientSearch(query: string) {
  return useQuery({
    queryKey: recipeKeys.ingredientSearch(query),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(20);

      if (error) throw new Error(error.message);
      return (data as Ingredient[]) ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
