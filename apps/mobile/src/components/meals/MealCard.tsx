import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { MealPlanItem, MealType } from '../../types';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Goûter',
};

interface MealCardProps {
  item: MealPlanItem;
  onPress: () => void;
  onDelete: () => void;
}

export function MealCard({ item, onPress, onDelete }: MealCardProps) {
  const profile = item.assigned_profile;
  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.content}>
        <Text style={styles.mealType}>{mealTypeLabels[item.meal_type]}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.recipe?.title ?? 'Recette'}
        </Text>
      </View>
      <View style={styles.right}>
        {profile && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.servings}>{item.servings} pers.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  content: { flex: 1 },
  mealType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 9, color: Colors.textInverse, fontWeight: '600' },
  servings: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
});
