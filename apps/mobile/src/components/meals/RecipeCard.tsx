import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Recipe } from '../../types';

const difficultyConfig = {
  easy: { label: 'Facile', color: Colors.success },
  medium: { label: 'Moyen', color: Colors.joy },
  hard: { label: 'Difficile', color: Colors.accent },
};

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onToggleFavorite: () => void;
  compact?: boolean;
}

export function RecipeCard({ recipe, onPress, onToggleFavorite, compact = false }: RecipeCardProps) {
  const diff = difficultyConfig[recipe.difficulty];
  const totalTime = recipe.prep_time + recipe.cook_time;
  const timeLabel =
    totalTime >= 60
      ? `${Math.floor(totalTime / 60)}h${totalTime % 60 > 0 ? totalTime % 60 : ''}`
      : `${totalTime}min`;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imageArea, compact && styles.imageAreaCompact]}>
        {recipe.source === 'user' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Foyer</Text>
          </View>
        )}
        <View style={styles.diffBadge}>
          <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
        </View>
        <TouchableOpacity
          style={styles.favButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.favIcon}>{recipe.is_favorite ? '❤️' : '♡'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.meta}>⏱ {timeLabel} · 👤 {recipe.servings}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardCompact: { minWidth: 150 },
  imageArea: { height: 70, backgroundColor: Colors.primary, position: 'relative' },
  imageAreaCompact: { height: 80 },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, color: Colors.primary, fontWeight: '600' },
  diffBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  diffText: { fontSize: 9, fontWeight: '600' },
  favButton: { position: 'absolute', top: 6, right: 6 },
  favIcon: { fontSize: 14 },
  body: { padding: Spacing.sm },
  title: { fontSize: Typography.fontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  meta: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
