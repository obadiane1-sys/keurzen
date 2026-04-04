import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { SharedListItem } from '../../types';

import { shoppingCategoryLabels } from './ListItemRow';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalized(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ShoppingCategorySectionProps {
  category: string;
  items: SharedListItem[];
  renderItem: (item: SharedListItem) => React.ReactNode;
  defaultExpanded?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ShoppingCategorySection({
  category,
  items,
  renderItem,
  defaultExpanded = true,
}: ShoppingCategorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const categoryConfig = shoppingCategoryLabels[category];
  const label = categoryConfig?.label ?? capitalized(category);
  const icon = categoryConfig?.icon;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${items.length} item${items.length !== 1 ? 's' : ''}, ${expanded ? 'replié' : 'développé'}`}
      >
        {/* Chevron */}
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={Colors.textMuted}
          style={styles.chevron}
        />

        {/* Category icon */}
        {icon ? (
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.textSecondary} />
        ) : null}

        {/* Category label */}
        <Text
          variant="bodySmall"
          color="secondary"
          weight="semibold"
          style={styles.label}
        >
          {label}
        </Text>

        {/* Item count */}
        <Text variant="bodySmall" color="muted" style={styles.count}>
          ({items.length})
        </Text>
      </TouchableOpacity>

      {/* Items */}
      {expanded && (
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <View key={item.id}>{renderItem(item)}</View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  chevron: {
    flexShrink: 0,
  },
  categoryIcon: {
    fontSize: 16,
    lineHeight: 20,
    flexShrink: 0,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  count: {
    fontSize: Typography.fontSize.sm,
    flexShrink: 0,
  },
  itemsContainer: {
    gap: 0,
  },
});
