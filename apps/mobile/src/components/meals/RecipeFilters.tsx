import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'rapide', label: 'Rapide (<30min)' },
  { key: 'vegetarien', label: 'Végétarien' },
  { key: 'familial', label: 'Familial' },
  { key: 'batch-cooking', label: 'Batch cooking' },
  { key: 'economique', label: 'Économique' },
  { key: 'sans-gluten', label: 'Sans gluten' },
];

interface RecipeFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function RecipeFilters({ activeFilter, onFilterChange }: RecipeFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onFilterChange(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  chip: {
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.terracotta, borderColor: Colors.terracotta },
  chipText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse, fontWeight: '600' },
});
