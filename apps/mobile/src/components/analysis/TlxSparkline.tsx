import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Colors, BorderRadius } from '../../constants/tokens';

interface TlxWeek {
  weekLabel: string;
  score: number;
}

interface TlxSparklineProps {
  weeks: TlxWeek[];
}

function getBarColor(score: number): string {
  if (score <= 33) return Colors.sauge;
  if (score <= 66) return '#FFD166';
  return Colors.rose;
}

const BAR_MAX_HEIGHT = 80;

function AnimatedBar({ score, color, delay }: { score: number; color: string; delay: number }) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: Math.max((score / 100) * BAR_MAX_HEIGHT, 4),
      duration: 600,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [score]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: heightAnim,
          backgroundColor: color,
        },
      ]}
    />
  );
}

export function TlxSparkline({ weeks }: TlxSparklineProps) {
  const reversed = [...weeks].reverse(); // oldest first

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="pulse" size={20} color={Colors.prune} />
          </View>
          <View>
            <Text variant="h4" weight="semibold" style={styles.title}>
              Charge mentale
            </Text>
            <Text variant="caption" style={styles.subtitle}>
              {reversed.length} dernières semaines
            </Text>
          </View>
        </View>
      </View>

      {reversed.length === 0 ? (
        <Text variant="caption" style={styles.emptyText}>
          Pas encore de données TLX
        </Text>
      ) : (
        <View style={styles.chartArea}>
          <View style={styles.barsRow}>
            {reversed.map((w, i) => (
              <View key={i} style={styles.barCol}>
                <AnimatedBar
                  score={w.score}
                  color={getBarColor(w.score)}
                  delay={i * 30}
                />
              </View>
            ))}
          </View>
          <View style={styles.labelsRow}>
            {reversed.map((w, i) => (
              <Text key={i} variant="caption" style={styles.weekLabel}>
                {w.weekLabel}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.prune + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartArea: {
    gap: 6,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
