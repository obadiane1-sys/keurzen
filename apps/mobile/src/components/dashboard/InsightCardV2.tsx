import React from 'react';
import { View, TouchableOpacity } from 'react-native';
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
    bgCard: 'bg-[#FFF5F5]',
    borderColor: 'border-danger/20',
    icon: 'alert-circle',
    bgIcon: 'bg-danger/20',
    iconColor: '#FF6B6B',
    labelColor: '#FF6B6B',
    ctaColor: '#FF6B6B',
  },
  conseil: {
    bgCard: 'bg-surface',
    borderColor: 'border-border',
    icon: 'chat-outline',
    bgIcon: 'bg-tertiary/20',
    iconColor: '#FFD700',
    labelColor: '#718096',
    ctaColor: '#00E5FF',
  },
  wellbeing: {
    bgCard: 'bg-surface',
    borderColor: 'border-border',
    icon: 'heart',
    bgIcon: 'bg-secondary/20',
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
      className={`min-w-[280px] p-5 rounded-3xl border-2 shadow-soft ${config.bgCard} ${config.borderColor}`}
    >
      {/* Header: icon + label */}
      <View className="flex-row items-center mb-4" style={{ gap: 12 }}>
        <BadgeIcon
          name={config.icon}
          size="lg"
          bgClassName={`${config.bgIcon} border-0`}
          iconColor={config.iconColor}
        />
        <Text
          className="uppercase tracking-widest"
          style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: config.labelColor }}
        >
          {insight.label}
        </Text>
      </View>

      {/* Message */}
      <Text
        className="text-base mb-4"
        style={{ fontFamily: 'Nunito_700Bold', color: '#2D3748' }}
        numberOfLines={3}
      >
        {insight.message}
      </Text>

      {/* CTA */}
      <View className="flex-row items-center">
        <Text
          className="uppercase tracking-wider"
          style={{ fontSize: 12, fontFamily: 'Outfit_700Bold', color: config.ctaColor }}
        >
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
