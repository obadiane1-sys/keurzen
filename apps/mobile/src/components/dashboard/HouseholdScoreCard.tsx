import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, Shadows } from '../../constants/tokens';

interface HouseholdScoreCardProps {
  score: number;
  trend: number | null;
}

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HouseholdScoreCard({ score, trend }: HouseholdScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedScore / 100);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.label}>Score du Foyer</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{clampedScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          {trend !== null && (
            <View style={styles.trendRow}>
              <View style={styles.trendPill}>
                <MaterialCommunityIcons
                  name={trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </Text>
              </View>
              <Text style={styles.trendLabel}>Semaine</Text>
            </View>
          )}
        </View>
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="#FFFFFF"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.primary}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              fill="none"
            />
          </Svg>
          <View style={styles.gaugeIcon}>
            <MaterialCommunityIcons name="scale-balance" size={28} color={Colors.primary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 40,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    ...Shadows.card,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 56,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.textPrimary,
    lineHeight: 60,
  },
  scoreMax: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  trendLabel: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeIcon: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
