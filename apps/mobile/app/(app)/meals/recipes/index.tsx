import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../../src/constants/tokens';
import { Text } from '../../../../src/components/ui/Text';
import { Loader } from '../../../../src/components/ui/Loader';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { RecipeCard } from '../../../../src/components/meals/RecipeCard';
import { RecipeFilters } from '../../../../src/components/meals/RecipeFilters';
import { useRecipes, useToggleFavorite } from '../../../../src/lib/queries/recipes';
import type { Recipe } from '../../../../src/types';

// ─── Filter → query params conversion ─────────────────────────────────────────

function buildFilterParams(
  activeFilter: string,
  search: string
): Parameters<typeof useRecipes>[0] {
  const params: Parameters<typeof useRecipes>[0] = {};
  if (search.trim()) {
    params.search = search.trim();
  }
  if (activeFilter === 'rapide') {
    params.maxTime = 30;
  } else if (activeFilter !== 'all') {
    params.tags = [activeFilter];
  }
  return params;
}

// ─── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function RecipeCatalogScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const debouncedSearch = useDebounce(searchText, 300);

  const filterParams = useMemo(
    () => buildFilterParams(activeFilter, debouncedSearch),
    [activeFilter, debouncedSearch]
  );

  // All recipes with current filter/search (system + household)
  const { data: allRecipes = [], isLoading, isError } = useRecipes(filterParams);

  // Household recipes (source='user') shown in the top horizontal section
  const { data: householdRecipes = [], isLoading: isLoadingHousehold } = useRecipes({
    ...filterParams,
    source: 'user',
  });

  // System recipes for the main catalog grid
  const { data: systemRecipes = [], isLoading: isLoadingSystem } = useRecipes({
    ...filterParams,
    source: 'system',
  });

  const toggleFav = useToggleFavorite();

  const handleToggleFav = useCallback(
    (recipe: Recipe) => {
      toggleFav.mutate({ recipeId: recipe.id, isFavorite: !!recipe.is_favorite });
    },
    [toggleFav]
  );

  const handleRecipePress = useCallback(
    (id: string) => {
      router.push(`/(app)/meals/recipes/${id}`);
    },
    [router]
  );

  const handleCreateRecipe = useCallback(() => {
    router.push('/(app)/meals/recipes/create');
  }, [router]);

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderHouseholdItem = useCallback(
    ({ item }: ListRenderItemInfo<Recipe>) => (
      <View style={styles.householdCardWrapper}>
        <RecipeCard
          recipe={item}
          compact
          onPress={() => handleRecipePress(item.id)}
          onToggleFavorite={() => handleToggleFav(item)}
        />
      </View>
    ),
    [handleRecipePress, handleToggleFav]
  );

  const renderCatalogItem = useCallback(
    ({ item }: ListRenderItemInfo<Recipe>) => (
      <View style={styles.gridCardWrapper}>
        <RecipeCard
          recipe={item}
          onPress={() => handleRecipePress(item.id)}
          onToggleFavorite={() => handleToggleFav(item)}
        />
      </View>
    ),
    [handleRecipePress, handleToggleFav]
  );

  const isAnyLoading = isLoading || isLoadingHousehold || isLoadingSystem;

  // ─── Sections rendered inside a single FlatList (catalog as base) ────────────

  const ListHeader = (
    <View>
      {/* Household Recipes section */}
      {(householdRecipes.length > 0 || isLoadingHousehold) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos recettes</Text>
          {isLoadingHousehold ? (
            <Loader size="small" />
          ) : (
            <FlatList
              horizontal
              data={householdRecipes}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={renderHouseholdItem}
            />
          )}
        </View>
      )}

      {/* Catalogue heading */}
      <View style={styles.catalogHeader}>
        <Text style={styles.sectionTitle}>Catalogue</Text>
        {systemRecipes.length > 0 && (
          <Text style={styles.catalogCount}>{systemRecipes.length} recette{systemRecipes.length > 1 ? 's' : ''}</Text>
        )}
      </View>
    </View>
  );

  const ListEmpty = isLoadingSystem ? (
    <Loader label="Chargement des recettes…" />
  ) : (
    <EmptyState
      variant="generic"
      title="Aucune recette trouvée"
      subtitle={
        debouncedSearch || activeFilter !== 'all'
          ? 'Essayez un autre filtre ou modifiez votre recherche.'
          : 'Le catalogue est vide pour l\'instant.'
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Recettes</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleCreateRecipe}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Rechercher une recette…"
            placeholderTextColor={Colors.placeholder}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <View style={styles.filtersContainer}>
        <RecipeFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {isAnyLoading && systemRecipes.length === 0 && householdRecipes.length === 0 ? (
        <Loader fullScreen label="Chargement des recettes…" />
      ) : (
        <FlatList
          data={systemRecipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          renderItem={renderCatalogItem}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Scroll content
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  catalogCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Horizontal list (household recipes)
  horizontalList: {
    gap: Spacing.md,
  },
  householdCardWrapper: {
    width: 150,
  },

  // 2-column grid (catalog)
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridCardWrapper: {
    flex: 1,
  },
});
