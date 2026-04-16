import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { useCreateMealPlanItem } from '../../../src/lib/queries/meals';
import { useRecipe } from '../../../src/lib/queries/recipes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { MealType } from '../../../src/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déj' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Goûter' },
];

const FR_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateNext14Days(): Array<{ iso: string; label: string; isToday: boolean }> {
  const days: Array<{ iso: string; label: string; isToday: boolean }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = FR_DAYS[d.getDay()];
    const dayNum = d.getDate();
    const label = i === 0 ? "Aujourd'hui" : `${dayName} ${dayNum}`;
    days.push({ iso, label, isToday: i === 0 });
  }
  return days;
}

function getInitial(name: string | null | undefined): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AddMealScreen() {
  const router = useRouter();
  const { recipeId, servings: servingsParam } = useLocalSearchParams<{
    recipeId?: string;
    servings?: string;
  }>();

  const { members } = useHouseholdStore();

  const days = useMemo(() => generateNext14Days(), []);
  const defaultServings = servingsParam ? parseInt(servingsParam, 10) : 4;

  const [selectedDate, setSelectedDate] = useState<string>(days[0].iso);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [selectedCook, setSelectedCook] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(defaultServings);

  const { data: recipe, isLoading: recipeLoading } = useRecipe(recipeId ?? '');
  const createMeal = useCreateMealPlanItem();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleChooseRecipe = useCallback(() => {
    router.push('/(app)/meals/recipes');
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (!recipeId) return;

    createMeal.mutate(
      {
        recipe_id: recipeId,
        date: selectedDate,
        meal_type: selectedMealType,
        servings,
        assigned_to: selectedCook ?? undefined,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  }, [recipeId, selectedDate, selectedMealType, servings, selectedCook, createMeal, router]);

  const isSubmitDisabled = !recipeId || createMeal.isPending;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter au planning</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recipe Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recette</Text>
            {recipeId ? (
              <View style={styles.recipeSelected}>
                {recipeLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <View style={styles.recipeIconContainer}>
                      <Ionicons name="restaurant" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {recipe?.title ?? 'Recette sélectionnée'}
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.chooseRecipeButton}
                onPress={handleChooseRecipe}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={18} color={Colors.primary} />
                <Text style={styles.chooseRecipeText}>Choisir une recette</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datePillsContainer}
            >
              {days.map((day) => {
                const isSelected = day.iso === selectedDate;
                return (
                  <TouchableOpacity
                    key={day.iso}
                    style={[styles.datePill, isSelected && styles.datePillSelected]}
                    onPress={() => setSelectedDate(day.iso)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.datePillText,
                        isSelected && styles.datePillTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Meal Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type de repas</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => {
                const isSelected = mt.value === selectedMealType;
                return (
                  <TouchableOpacity
                    key={mt.value}
                    style={[styles.mealTypeChip, isSelected && styles.mealTypeChipSelected]}
                    onPress={() => setSelectedMealType(mt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.mealTypeChipText,
                        isSelected && styles.mealTypeChipTextSelected,
                      ]}
                    >
                      {mt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Cook Assignment */}
          {members.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cuisinier(e)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.membersContainer}
              >
                {/* No assignment option */}
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    selectedCook === null && styles.memberItemSelected,
                  ]}
                  onPress={() => setSelectedCook(null)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.memberAvatar, styles.memberAvatarNone]}>
                    <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.memberName}>Aucun</Text>
                </TouchableOpacity>

                {members.map((member) => {
                  const isSelected = member.user_id === selectedCook;
                  const initial = getInitial(member.profile?.full_name);
                  return (
                    <TouchableOpacity
                      key={member.user_id}
                      style={[
                        styles.memberItem,
                        isSelected && styles.memberItemSelected,
                      ]}
                      onPress={() => setSelectedCook(member.user_id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.memberAvatar,
                          { backgroundColor: member.color + '33' },
                          isSelected && { borderColor: member.color, borderWidth: 2 },
                        ]}
                      >
                        <Text style={[styles.memberInitial, { color: member.color }]}>
                          {initial}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.memberName,
                          isSelected && styles.memberNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {member.profile?.full_name?.split(' ')[0] ?? '?'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Servings */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Portions</Text>
            <View style={styles.servingsRow}>
              <TouchableOpacity
                style={[styles.servingsButton, servings <= 1 && styles.servingsButtonDisabled]}
                onPress={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={servings <= 1 ? Colors.textMuted : Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.servingsValue}>{servings}</Text>
              <TouchableOpacity
                style={[styles.servingsButton, servings >= 20 && styles.servingsButtonDisabled]}
                onPress={() => setServings((s) => Math.min(20, s + 1))}
                disabled={servings >= 20}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={servings >= 20 ? Colors.textMuted : Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.servingsUnit}>
                {servings <= 1 ? 'personne' : 'personnes'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaButton, isSubmitDisabled && styles.ctaButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            activeOpacity={0.8}
          >
            {createMeal.isPending ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color={Colors.textInverse} />
                <Text style={styles.ctaText}>Ajouter au planning</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentContainer: {
    paddingVertical: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Recipe
  recipeSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 44,
  },
  recipeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  chooseRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '0F',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },
  chooseRecipeText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },

  // Date pills
  datePillsContainer: {
    paddingRight: Spacing.base,
    gap: Spacing.xs,
  },
  datePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  datePillText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    whiteSpace: 'nowrap',
  },
  datePillTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Meal type chips
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  mealTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  mealTypeChipTextSelected: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Members
  membersContainer: {
    paddingRight: Spacing.base,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  memberItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 56,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  memberItemSelected: {
    backgroundColor: Colors.primary + '12',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarNone: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  memberInitial: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  memberName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    maxWidth: 56,
    textAlign: 'center',
  },
  memberNameSelected: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Servings
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  servingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.4,
  },
  servingsValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  servingsUnit: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md + 2,
    minHeight: 52,
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textInverse,
  },
});
