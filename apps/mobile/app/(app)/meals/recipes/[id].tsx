import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../../src/constants/tokens';
import { Text } from '../../../../src/components/ui/Text';
import { Loader } from '../../../../src/components/ui/Loader';
import { IngredientRow } from '../../../../src/components/meals/IngredientRow';
import { StepRow } from '../../../../src/components/meals/StepRow';
import { useRecipe, useToggleFavorite } from '../../../../src/lib/queries/recipes';
import type { RecipeDifficulty } from '../../../../src/types';

// ─── Difficulty config ─────────────────────────────────────────────────────────

const difficultyConfig: Record<RecipeDifficulty, { label: string; color: string }> = {
  easy: { label: 'Facile', color: Colors.success },
  medium: { label: 'Moyen', color: Colors.joy },
  hard: { label: 'Difficile', color: Colors.accent },
};

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: recipe, isLoading } = useRecipe(id);
  const toggleFav = useToggleFavorite();

  const [currentServings, setCurrentServings] = useState<number | null>(null);

  // Initialize servings once recipe is loaded
  const servings = currentServings ?? recipe?.servings ?? 1;
  const servingsRatio = recipe ? servings / recipe.servings : 1;

  const handleDecrease = () => setCurrentServings(Math.max(1, servings - 1));
  const handleIncrease = () => setCurrentServings(Math.min(20, servings + 1));

  const handleToggleFavorite = () => {
    if (!recipe) return;
    toggleFav.mutate({ recipeId: recipe.id, isFavorite: !!recipe.is_favorite });
  };

  const handleAddToPlanning = () => {
    router.push(`/(app)/meals/add?recipeId=${id}&servings=${servings}`);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (isLoading || !recipe) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Loader fullScreen label="Chargement de la recette…" />
      </SafeAreaView>
    );
  }

  const difficulty = difficultyConfig[recipe.difficulty];
  const sortedSteps = [...(recipe.steps ?? [])].sort((a, b) => a.order - b.order);
  const ingredients = recipe.ingredients ?? [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          <View style={styles.heroButtons}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textInverse} />
            </TouchableOpacity>

            {/* Favorite button */}
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={handleToggleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={recipe.is_favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={recipe.is_favorite ? Colors.accent : Colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content card that overlaps the hero */}
        <View style={styles.contentCard}>

          {/* ── Title + description ────────────────────────────────────────── */}
          <Text variant="h3" style={styles.title}>{recipe.title}</Text>
          {recipe.description ? (
            <Text variant="bodySmall" color="secondary" style={styles.description}>
              {recipe.description}
            </Text>
          ) : null}

          {/* ── Meta row ───────────────────────────────────────────────────── */}
          <View style={styles.metaRow}>
            {/* Prep time */}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.metaLabel}>Prép.</Text>
                <Text style={styles.metaValue}>{recipe.prep_time} min</Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            {/* Cook time */}
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={16} color={Colors.joy} />
              <View>
                <Text style={styles.metaLabel}>Cuisson</Text>
                <Text style={styles.metaValue}>{recipe.cook_time} min</Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            {/* Portions */}
            <View style={styles.metaItem}>
              <View style={styles.portionsControl}>
                <TouchableOpacity
                  style={styles.portionBtn}
                  onPress={handleDecrease}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove" size={14} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.metaLabel}>Portions</Text>
                  <Text style={[styles.metaValue, styles.portionValue]}>{servings}</Text>
                </View>
                <TouchableOpacity
                  style={styles.portionBtn}
                  onPress={handleIncrease}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metaDivider} />

            {/* Difficulty badge */}
            <View style={[styles.difficultyBadge, { backgroundColor: `${difficulty.color}22` }]}>
              <Text style={[styles.difficultyText, { color: difficulty.color }]}>
                {difficulty.label}
              </Text>
            </View>
          </View>

          {/* ── Tags ───────────────────────────────────────────────────────── */}
          {recipe.tags && recipe.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScroll}
              contentContainerStyle={styles.tagsContent}
            >
              {recipe.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── Ingredients section ─────────────────────────────────────────── */}
          {ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              <View style={styles.ingredientsCard}>
                {ingredients.map((item) => (
                  <IngredientRow
                    key={item.id}
                    item={item}
                    servingsRatio={servingsRatio}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Steps section ───────────────────────────────────────────────── */}
          {sortedSteps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Étapes</Text>
              {sortedSteps.map((step) => (
                <StepRow
                  key={step.order}
                  stepNumber={step.order}
                  text={step.text}
                />
              ))}
            </View>
          )}

          {/* Bottom padding for CTA */}
          <View style={styles.ctaSpacer} />
        </View>
      </ScrollView>

      {/* ── CTA button ────────────────────────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleAddToPlanning} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textInverse} style={styles.ctaIcon} />
          <Text style={styles.ctaText}>Ajouter au planning</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const HERO_HEIGHT = 170;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  heroSafeArea: {
    flex: 1,
  },
  heroButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  heroBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
    marginTop: HERO_HEIGHT - BorderRadius.lg,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },

  // Content card (overlaps hero)
  contentCard: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    ...Shadows.md,
    minHeight: 400,
  },

  // Title
  title: {
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  description: {
    marginBottom: Spacing.base,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    minWidth: 60,
  },
  metaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.regular,
  },
  metaValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semibold,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Portions
  portionsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  portionBtn: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}44`,
  },
  portionValue: {
    textAlign: 'center',
    minWidth: 20,
  },

  // Difficulty badge
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Tags
  tagsScroll: {
    marginBottom: Spacing.lg,
  },
  tagsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  // Ingredients card
  ingredientsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },

  // CTA spacer
  ctaSpacer: {
    height: Spacing.xl,
  },

  // CTA
  ctaContainer: {
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  ctaIcon: {
    marginRight: 2,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textInverse,
  },
});
