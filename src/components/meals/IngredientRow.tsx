import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { RecipeIngredient } from '../../types';

interface IngredientRowProps {
  item: RecipeIngredient;
  servingsRatio: number;
}

export function IngredientRow({ item, servingsRatio }: IngredientRowProps) {
  const adjustedQty = Math.round(item.quantity * servingsRatio * 10) / 10;
  const name = item.ingredient?.name ?? '';
  const note = item.note ? ` (${item.note})` : '';

  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>{name}{note}</Text>
      <Text style={styles.qty}>{adjustedQty} {item.unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  name: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, flex: 1 },
  qty: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginLeft: Spacing.sm },
});
