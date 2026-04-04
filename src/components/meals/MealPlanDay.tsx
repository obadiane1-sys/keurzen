import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { MealCard } from './MealCard';
import type { MealPlanItem } from '../../types';

const DAY_NAMES = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTH_NAMES = [
  'JANV.', 'FÉV.', 'MARS', 'AVR.', 'MAI', 'JUIN',
  'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.',
];

interface MealPlanDayProps {
  date: Date;
  items: MealPlanItem[];
  onMealPress: (item: MealPlanItem) => void;
  onMealDelete: (item: MealPlanItem) => void;
  onAddPress: () => void;
}

export function MealPlanDay({ date, items, onMealPress, onMealDelete, onAddPress }: MealPlanDayProps) {
  const dayLabel = `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

  return (
    <View style={styles.container}>
      <Text style={styles.dayLabel}>{dayLabel}</Text>
      {items.length > 0 ? (
        <View style={styles.meals}>
          {items.map((item) => (
            <MealCard
              key={item.id}
              item={item}
              onPress={() => onMealPress(item)}
              onDelete={() => onMealDelete(item)}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity style={styles.emptySlot} onPress={onAddPress} activeOpacity={0.7}>
          <Text style={styles.emptyText}>+ Ajouter un repas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  dayLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.terracotta,
    marginBottom: Spacing.sm,
  },
  meals: { gap: Spacing.sm },
  emptySlot: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
