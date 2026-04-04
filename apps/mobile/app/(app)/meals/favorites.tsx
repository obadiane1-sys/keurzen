import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { RecipeCard } from '../../../src/components/meals/RecipeCard';
import { useFavoriteRecipes, useToggleFavorite } from '../../../src/lib/queries/recipes';
import type { Recipe } from '../../../src/types';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: favorites = [], isLoading } = useFavoriteRecipes();
  const toggleFav = useToggleFavorite();

  const handlePress = useCallback(
    (recipe: Recipe) => {
      router.push(`/(app)/meals/recipes/${recipe.id}`);
    },
    [router]
  );

  const handleToggleFavorite = useCallback(
    (recipe: Recipe) => {
      toggleFav.mutate({ recipeId: recipe.id, isFavorite: !!recipe.is_favorite });
    },
    [toggleFav]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <View style={styles.cardWrapper}>
        <RecipeCard
          recipe={item}
          onPress={() => handlePress(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
        />
      </View>
    ),
    [handlePress, handleToggleFavorite]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subtitle count */}
      {!isLoading && favorites.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {favorites.length} recette{favorites.length > 1 ? 's' : ''} en favori
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <Loader />
      ) : favorites.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Aucun favori pour l'instant"
          subtitle="Appuyez sur ❤️ dans une recette pour l'ajouter à vos favoris."
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  countText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
});
