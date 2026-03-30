import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, TouchTarget } from '../../constants/tokens';
import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Passer `false` pour cacher le bouton retour */
  showBack?: boolean;
  /** Slot droit : bouton d'action ou icône personnalisée */
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Header standard pour les écrans Keurzen.
 * Remplace le pattern manuel répété dans chaque écran :
 *   back button | titre centré | slot droit (optionnel)
 *
 * Usage :
 *   <ScreenHeader title="Mon écran" />
 *   <ScreenHeader title="Mon écran" rightAction={<Button ... />} />
 *   <ScreenHeader title="Mon écran" onBack={() => router.push('/(app)/dashboard')} />
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightAction,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.container, style]}>
      {/* Left — back button */}
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.side} activeOpacity={0.7} accessibilityLabel="Retour" accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}

      {/* Center — title + subtitle */}
      <View style={styles.center}>
        <Text variant="h3" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right — action slot or spacer */}
      <View style={styles.side}>
        {rightAction ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  side: {
    width: TouchTarget.min,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
});
