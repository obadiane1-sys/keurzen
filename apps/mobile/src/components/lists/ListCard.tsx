import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import type { SharedList, SharedListType } from '../../types';

// ─── Label Map ───────────────────────────────────────────────────────────────

export const typeLabels: Record<SharedListType, { label: string; color: string; defaultIcon: string }> = {
  shopping: { label: 'Courses', color: Colors.success, defaultIcon: 'cart-outline' },
  todo: { label: 'Todo', color: Colors.primary, defaultIcon: 'checkmark-circle-outline' },
  custom: { label: 'Perso', color: Colors.joy, defaultIcon: 'list-outline' },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ListCardProps {
  list: SharedList;
  onPress: () => void;
}

export function ListCard({ list, onPress }: ListCardProps) {
  const typeConfig = typeLabels[list.type];
  const iconName = (list.icon ?? typeConfig.defaultIcon) as keyof typeof Ionicons.glyphMap;
  const iconBgColor = list.color ? list.color + '33' : typeConfig.color + '33'; // ~20% opacity
  const itemCount = list.item_count ?? 0;
  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

  return (
    <Card onPress={onPress} padding="md" radius="xl">
      <View style={styles.row}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          <Ionicons
            name={iconName}
            size={20}
            color={list.color ?? typeConfig.color}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            variant="body"
            color="primary"
            weight="semibold"
            numberOfLines={1}
            style={styles.title}
          >
            {list.title}
          </Text>

          <View style={styles.subtitleRow}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '33' }]}>
              <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>

            <Text variant="bodySmall" color="muted">
              {' · '}
            </Text>

            <Text variant="bodySmall" color="muted">
              {itemLabel}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});
