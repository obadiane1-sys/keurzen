import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { IconTrendUp, IconTrendDown } from './Icons';
import { DCOLORS, DFONT } from './constants';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  accentColor: string;
  bgColor?: string;
  onPress?: () => void;
}

export function KPICard({
  icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  accentColor,
  bgColor,
  onPress,
}: KPICardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Decorative corner circle */}
      <View
        style={[
          styles.cornerCircle,
          { backgroundColor: bgColor || accentColor + '15' },
        ]}
      />

      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: bgColor || accentColor + '18' },
          ]}
        >
          {icon}
        </View>
        <Text
          variant="caption"
          weight="medium"
          style={{ color: DCOLORS.textSecondary, fontSize: DFONT.caption.size }}
        >
          {label}
        </Text>
      </View>

      <View style={styles.valueSection}>
        <View style={styles.valueRow}>
          <Text
            variant="h1"
            weight="bold"
            style={styles.valueText}
          >
            {value}
          </Text>
          {trend && (
            <View style={styles.trendRow}>
              {trend === 'up' ? (
                <IconTrendUp size={14} />
              ) : (
                <IconTrendDown size={14} />
              )}
              <Text
                variant="caption"
                weight="semibold"
                style={{
                  fontSize: 13,
                  color: trend === 'up' ? DCOLORS.mint : DCOLORS.coral,
                }}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        {subtext && (
          <Text
            variant="caption"
            style={{ color: DCOLORS.textMuted, fontSize: DFONT.caption.size, marginTop: 2 }}
          >
            {subtext}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DCOLORS.surface,
    borderRadius: 20,
    padding: 22,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: DCOLORS.border,
    flex: 1,
    minWidth: 155,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueSection: {
    zIndex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '800',
    color: DCOLORS.navy,
    letterSpacing: -0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
