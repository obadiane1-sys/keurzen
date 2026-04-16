import React from 'react';
import { StyleSheet, TouchableOpacity, View, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import type { TaskVariant } from '../../lib/utils/taskVariants';
import { categoryLabels } from './TaskCard';
import { formatVariantSubtitle } from '../../lib/utils/taskVariants';

interface TaskSuggestionsProps {
  query: string;
  variants: TaskVariant[];
  onSelect: (variant: TaskVariant) => void;
  visible: boolean;
}

export const TaskSuggestions = React.memo(function TaskSuggestions({
  query,
  variants,
  onSelect,
  visible,
}: TaskSuggestionsProps) {
  if (!visible || variants.length === 0) return null;

  const q = query.toLowerCase();

  return (
    <View style={styles.container}>
      {variants.map((variant, i) => {
        const title = variant.title;
        const lowerTitle = title.toLowerCase();
        const matchIndex = lowerTitle.indexOf(q);
        const cat = categoryLabels[variant.category] ?? categoryLabels.other;
        const subtitle = formatVariantSubtitle(variant, categoryLabels);

        return (
          <TouchableOpacity
            key={`${title}-${variant.category}-${variant.recurrence}-${variant.estimatedMinutes}-${i}`}
            style={[styles.row, i === 0 && styles.rowFirst]}
            onPress={() => onSelect(variant)}
            activeOpacity={0.6}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={cat.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.text} numberOfLines={1}>
                {matchIndex >= 0 ? (
                  <>
                    {title.substring(0, matchIndex)}
                    <Text style={styles.textHighlight}>
                      {title.substring(matchIndex, matchIndex + q.length)}
                    </Text>
                    {title.substring(matchIndex + q.length)}
                  </>
                ) : (
                  title
                )}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Ionicons
              name="arrow-up-outline"
              size={14}
              color={Colors.textMuted}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    minHeight: 56,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textHighlight: {
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.primary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  arrowIcon: {
    marginLeft: Spacing.sm,
    transform: [{ rotate: '-45deg' }],
  },
});
