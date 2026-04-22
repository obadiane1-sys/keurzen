import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { MealPlanDay } from '../../../src/components/meals/MealPlanDay';
import { RecipeCard } from '../../../src/components/meals/RecipeCard';
import { useMealPlan, useDeleteMealPlanItem, useMealHistory } from '../../../src/lib/queries/meals';
import { useToggleFavorite, useFavoriteRecipes } from '../../../src/lib/queries/recipes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { MealPlanItem, Recipe } from '../../../src/types';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} — ${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]}`;
}

export default function MealsScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const ws = getWeekStart(new Date());
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [weekOffset]);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const { data: meals = [], isLoading } = useMealPlan(weekStartStr);
  const { data: history = [] } = useMealHistory();
  const deleteMeal = useDeleteMealPlanItem();
  const toggleFav = useToggleFavorite();
  const { data: favoriteRecipes = [] } = useFavoriteRecipes();
  const favoriteIds = useMemo(
    () => new Set(favoriteRecipes.map((r) => r.id)),
    [favoriteRecipes]
  );

  const days = useMemo(() => {
    const result: { date: Date; items: MealPlanItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: d,
        items: meals.filter((m) => m.date === dateStr),
      });
    }
    return result;
  }, [weekStart, meals]);

  const suggestions = useMemo(() => {
    const freq = new Map<string, { count: number; recipe: Recipe }>();
    for (const item of history) {
      if (!item.recipe) continue;
      const existing = freq.get(item.recipe_id);
      if (existing) {
        existing.count++;
      } else {
        freq.set(item.recipe_id, { count: 1, recipe: item.recipe });
      }
    }
    return [...freq.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((f) => ({ ...f.recipe, is_favorite: favoriteIds.has(f.recipe.id) }));
  }, [history, favoriteIds]);

  const handleMealPress = useCallback(
    (item: MealPlanItem) => {
      if (item.recipe_id) {
        router.push(`/(app)/meals/recipes/${item.recipe_id}`);
      }
    },
    [router]
  );

  const handleMealDelete = useCallback(
    (item: MealPlanItem) => {
      deleteMeal.mutate({ id: item.id, taskId: item.task_id });
    },
    [deleteMeal]
  );

  const handleAddPress = useCallback(() => {
    router.push('/(app)/meals/add');
  }, [router]);

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="household"
          title="Rejoignez un foyer"
          subtitle="Vous devez faire partie d'un foyer pour planifier les repas."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Repas</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(app)/meals/recipes')}
            >
              <Text style={styles.headerBtnText}>Recettes</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setWeekOffset((o) => o - 1)}>
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
          <TouchableOpacity onPress={() => setWeekOffset((o) => o + 1)}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {days.map((day) => (
            <MealPlanDay
              key={day.date.toISOString()}
              date={day.date}
              items={day.items}
              onMealPress={handleMealPress}
              onMealDelete={handleMealDelete}
              onAddPress={handleAddPress}
            />
          ))}

          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Suggestions pour vous</Text>
              <FlatList
                horizontal
                data={suggestions}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
                renderItem={({ item }) => (
                  <View style={styles.suggestionCard}>
                    <RecipeCard
                      recipe={item}
                      compact
                      onPress={() => router.push(`/(app)/meals/recipes/${item.id}`)}
                      onToggleFavorite={() =>
                        toggleFav.mutate({ recipeId: item.id, isFavorite: !!item.is_favorite })
                      }
                    />
                  </View>
                )}
              />
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    backgroundColor: `${Colors.terracotta}22`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerBtnText: { fontSize: Typography.fontSize.xs, color: Colors.terracotta, fontWeight: '600' },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  weekLabel: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  suggestionsSection: { marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  suggestionsScroll: { gap: Spacing.md },
  suggestionCard: { width: 150 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: BorderRadius.fab,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
