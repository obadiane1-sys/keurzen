import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import type { HubTileConfig, HubTileIcon } from '@keurzen/shared';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/tokens';

const ICON_MAP: Record<HubTileIcon, keyof typeof Ionicons.glyphMap> = {
  grid: 'grid-outline',
  basket: 'basket-outline',
  cash: 'cash-outline',
  settings: 'settings-outline',
  pulse: 'pulse-outline',
  calendar: 'calendar-outline',
  chat: 'chatbubble-outline',
};

interface Props {
  config: HubTileConfig;
}

export function HubTile({ config }: Props) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={config.label}
      onPress={() => router.push(config.route as never)}
      style={({ pressed }) => [
        styles.tile,
        config.accent && styles.tileAccent,
        pressed && styles.tilePressed,
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={ICON_MAP[config.icon]}
          size={28}
          color={Colors.primary}
        />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {config.label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 120,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  tileAccent: {
    backgroundColor: Colors.primaryLight,
  },
  tilePressed: {
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
