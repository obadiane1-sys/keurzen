import React from 'react';
import { StyleSheet, TouchableOpacity, View, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

interface TaskSuggestionsProps {
  query: string;
  suggestions: string[];
  onSelect: (title: string) => void;
  visible: boolean;
  maxResults?: number;
}

export const TaskSuggestions = React.memo(function TaskSuggestions({
  query,
  suggestions,
  onSelect,
  visible,
  maxResults = 5,
}: TaskSuggestionsProps) {
  if (!visible || query.length < 2) return null;

  const q = query.toLowerCase();
  const filtered = suggestions
    .filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
    .slice(0, maxResults);

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      {filtered.map((title, i) => {
        // Highlight the matching part
        const lowerTitle = title.toLowerCase();
        const matchIndex = lowerTitle.indexOf(q);

        return (
          <TouchableOpacity
            key={`${title}-${i}`}
            style={[styles.row, i === 0 && styles.rowFirst]}
            onPress={() => onSelect(title)}
            activeOpacity={0.6}
          >
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={styles.icon} />
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
            <Ionicons name="arrow-up-outline" size={14} color={Colors.textMuted} style={styles.arrowIcon} />
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
    minHeight: 44,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textHighlight: {
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.terracotta,
  },
  arrowIcon: {
    marginLeft: Spacing.sm,
    transform: [{ rotate: '-45deg' }],
  },
});
