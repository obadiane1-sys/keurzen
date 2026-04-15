import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import type { HubTileConfig, HubTileIcon } from '@keurzen/shared';

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
          color="#967BB6"
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
    backgroundColor: '#F9F8FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD7E8',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tileAccent: {
    backgroundColor: '#E5DBFF',
  },
  tilePressed: {
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: '#5F5475',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
