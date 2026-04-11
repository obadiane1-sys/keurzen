import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { BadgeIcon } from '../ui/BadgeIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CoachingInsight } from '@keurzen/shared';

const TYPE_CONFIG: Record<string, {
  bgCard: string;
  borderColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  bgIcon: string;
  iconColor: string;
  labelColor: string;
  ctaColor: string;
}> = {
  alert: {
    bgCard: '#FFF5F5',
    borderColor: 'rgba(255, 107, 107, 0.2)',
    icon: 'alert-circle',
    bgIcon: 'rgba(255, 107, 107, 0.2)',
    iconColor: '#FF6B6B',
    labelColor: '#FF6B6B',
    ctaColor: '#FF6B6B',
  },
  conseil: {
    bgCard: '#FFFFFF',
    borderColor: '#E2E8F0',
    icon: 'chat-outline',
    bgIcon: 'rgba(255, 215, 0, 0.2)',
    iconColor: '#FFD700',
    labelColor: '#718096',
    ctaColor: '#00E5FF',
  },
  wellbeing: {
    bgCard: '#FFFFFF',
    borderColor: '#E2E8F0',
    icon: 'heart',
    bgIcon: 'rgba(255, 182, 193, 0.2)',
    iconColor: '#FFB6C1',
    labelColor: '#718096',
    ctaColor: '#FFB6C1',
  },
};

interface InsightCardV2Props {
  insight: CoachingInsight;
  onPress?: () => void;
}

export function InsightCardV2({ insight, onPress }: InsightCardV2Props) {
  const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.conseil;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: config.bgCard, borderColor: config.borderColor }]}
    >
      {/* Header: icon + label */}
      <View style={styles.headerRow}>
        <BadgeIcon
          name={config.icon}
          size="lg"
          bgColor={config.bgIcon}
          iconColor={config.iconColor}
          noBorder
          noShadow={false}
        />
        <Text style={[styles.label, { color: config.labelColor }]}>
          {insight.label}
        </Text>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>
        {insight.message}
      </Text>

      {/* CTA */}
      <View style={styles.ctaRow}>
        <Text style={[styles.ctaText, { color: config.ctaColor }]}>
          {insight.cta_label}
        </Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={16}
          color={config.ctaColor}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 280,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
