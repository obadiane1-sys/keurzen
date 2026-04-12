import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Animation,
} from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { SharedListItem } from '../../types';

// ─── Category Labels ─────────────────────────────────────────────────────────

export const shoppingCategoryLabels: Record<string, { label: string; icon: string }> = {
  fruits_legumes: { label: 'Fruits & Légumes', icon: 'nutrition-outline' },
  viandes_poissons: { label: 'Viandes', icon: 'fish-outline' },
  produits_laitiers: { label: 'Laitier', icon: 'water-outline' },
  boulangerie: { label: 'Boulangerie', icon: 'cafe-outline' },
  epicerie: { label: 'Épicerie', icon: 'basket-outline' },
  surgeles: { label: 'Surgelés', icon: 'snow-outline' },
  boissons: { label: 'Boissons', icon: 'beer-outline' },
  hygiene: { label: 'Hygiène', icon: 'sparkles-outline' },
  entretien: { label: 'Entretien', icon: 'color-fill-outline' },
  autre: { label: 'Autre', icon: 'ellipsis-horizontal-outline' },
};

// Subtle pastel backgrounds per category key
const categoryColors: Record<string, string> = {
  fruits_legumes: Colors.success + '33',
  viandes_poissons: Colors.accent + '33',
  produits_laitiers: Colors.joy + '33',
  boulangerie: '#FBBF24' + '33',
  epicerie: Colors.primary + '33',
  surgeles: Colors.joy + '55',
  boissons: Colors.success + '55',
  hygiene: Colors.primary + '55',
  entretien: Colors.accent + '55',
  autre: Colors.gray200,
};

const categoryTextColors: Record<string, string> = {
  fruits_legumes: Colors.success,
  viandes_poissons: Colors.accent,
  produits_laitiers: Colors.primary,
  boulangerie: Colors.primary,
  epicerie: Colors.textSecondary,
  surgeles: Colors.primary,
  boissons: Colors.success,
  hygiene: '#7C3AED',
  entretien: Colors.primary,
  autre: Colors.textMuted,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ListItemRowProps {
  item: SharedListItem;
  onToggle: () => void;
  onLongPress?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ListItemRow = React.memo(function ListItemRow({
  item,
  onToggle,
  onLongPress,
}: ListItemRowProps) {
  const checkScale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 0.8,
        useNativeDriver: true,
        ...Animation.spring.stiff,
      }),
      Animated.spring(checkScale, {
        toValue: 1.0,
        useNativeDriver: true,
        ...Animation.spring.bouncy,
      }),
    ]).start();
    onToggle();
  };

  const categoryInfo = item.category ? shoppingCategoryLabels[item.category] : null;
  const categoryBg = item.category ? (categoryColors[item.category] ?? Colors.gray100) : Colors.gray100;
  const categoryTextColor = item.category ? (categoryTextColors[item.category] ?? Colors.textMuted) : Colors.textMuted;

  const titleStyle = item.checked ? [styles.titleText, styles.titleChecked] : styles.titleText;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      style={styles.row}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View
          style={[
            styles.checkbox,
            item.checked ? styles.checkboxChecked : styles.checkboxUnchecked,
            { transform: [{ scale: checkScale }] },
          ]}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Title */}
      <Text
        variant="body"
        color={item.checked ? 'muted' : 'primary'}
        style={titleStyle}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {/* Right badges */}
      <View style={styles.rightSection}>
        {/* Quantity badge */}
        {!!item.quantity && (
          <View style={styles.quantityBadge}>
            <Text style={styles.badgeText} color="secondary">
              {item.quantity}
            </Text>
          </View>
        )}

        {/* Category tag */}
        {categoryInfo && (
          <View style={[styles.categoryTag, { backgroundColor: categoryBg }]}>
            <Ionicons
              name={categoryInfo.icon as keyof typeof Ionicons.glyphMap}
              size={10}
              color={categoryTextColor}
              style={styles.categoryIcon}
            />
            <Text style={[styles.badgeText, { color: categoryTextColor }]}>
              {categoryInfo.label}
            </Text>
          </View>
        )}

        {/* Assigned avatar */}
        {item.assigned_profile && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(item.assigned_profile.full_name)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const CHECKBOX_SIZE = 28;
const AVATAR_SIZE = 24;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },

  // Checkbox
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.success,
  },

  // Title
  titleText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
  },
  titleChecked: {
    textDecorationLine: 'line-through',
  },

  // Right section
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },

  // Quantity badge
  quantityBadge: {
    backgroundColor: Colors.gray100,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },

  // Category tag
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  categoryIcon: {
    flexShrink: 0,
  },

  // Shared badge text
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.joy + '55',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
