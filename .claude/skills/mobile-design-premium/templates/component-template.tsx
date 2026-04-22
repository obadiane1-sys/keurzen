/**
 * Component Template — Keurzen
 *
 * Usage : copier ce fichier comme point de depart pour un nouveau composant.
 * Remplacer les placeholders entre [crochets].
 *
 * Checklist :
 * - [ ] Props typees strictement (pas de `any`)
 * - [ ] Tokens uniquement (zero hardcode)
 * - [ ] Touch targets >= 44px si interactif
 * - [ ] accessibilityRole + accessibilityLabel si interactif
 * - [ ] StyleSheet.create en bas du fichier
 * - [ ] Equivalent web cree en parallele
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget } from '../../constants/tokens';
import { Text } from './Text';

interface [ComponentName]Props {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'accent';
  onPress?: () => void;
  // children?: React.ReactNode;
}

export function [ComponentName]({
  title,
  subtitle,
  variant = 'default',
  onPress,
}: [ComponentName]Props) {
  const content = (
    <View style={[styles.container, variant === 'accent' && styles.accent]}>
      <Text weight="semibold" size="base" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text size="sm" color={Colors.textSecondary}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{ minHeight: TouchTarget.min }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  accent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.terracotta,
  },
  title: {
    color: Colors.textPrimary,
  },
});
