import React, { useEffect, useRef } from 'react';
import { StyleSheet, Pressable, View, Animated, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeurzenMascot from '../ui/KeurzenMascot';
import { Text } from '../ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

// ─── Confetti dots ──────────────────────────────────────────────────────────

const CONFETTI = [
  { color: Colors.sauge, x: -30, y: -70, size: 10 },
  { color: Colors.terracotta, x: 20, y: -80, size: 8 },
  { color: Colors.prune, x: 45, y: -60, size: 12 },
  { color: Colors.miel, x: -45, y: -55, size: 9 },
  { color: Colors.sauge, x: 60, y: -75, size: 10 },
  { color: Colors.terracotta, x: -15, y: -85, size: 8 },
  { color: Colors.prune, x: 35, y: -65, size: 11 },
  { color: Colors.sauge, x: -55, y: -70, size: 9 },
];

function ConfettiDot({
  color,
  targetX,
  targetY,
  size,
  index,
}: {
  color: string;
  targetX: number;
  targetY: number;
  size: number;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateX, {
      toValue: targetX,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: targetY,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, [index, opacity, targetX, targetY, translateX, translateY]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
          ],
        },
      ]}
    />
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface TaskCompletionToastProps {
  taskName: string;
  visible: boolean;
  onDismiss: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TaskCompletionToast({
  taskName,
  visible,
  onDismiss,
}: TaskCompletionToastProps) {
  const insets = useSafeAreaInsets();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Card entrance
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Mascot bounce
  const mascotTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      cardTranslateY.setValue(60);
      cardScale.setValue(0.88);
      cardOpacity.setValue(0);
      mascotTranslateY.setValue(0);

      // Entrance
      Animated.spring(cardTranslateY, { toValue: 0, damping: 14, stiffness: 180, useNativeDriver: true }).start();
      Animated.spring(cardScale, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: true }).start();
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

      // Mascot bounce after 300ms
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(mascotTranslateY, { toValue: -14, damping: 8, stiffness: 200, useNativeDriver: true }),
          Animated.spring(mascotTranslateY, { toValue: -7, damping: 10, stiffness: 200, useNativeDriver: true }),
          Animated.spring(mascotTranslateY, { toValue: 0, damping: 12, stiffness: 200, useNativeDriver: true }),
        ]).start();
      }, 300);

      // Auto-dismiss
      dismissTimer.current = setTimeout(() => {
        handleExit();
      }, 2500);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleExit = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(cardOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    Animated.timing(cardTranslateY, { toValue: 20, duration: 280, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={handleExit}>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateY: cardTranslateY },
                { scale: cardScale },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Confetti */}
          {CONFETTI.map((c, i) => (
            <ConfettiDot
              key={i}
              color={c.color}
              targetX={c.x}
              targetY={c.y}
              size={c.size}
              index={i}
            />
          ))}

          {/* Mascot */}
          <Animated.View style={{ transform: [{ translateY: mascotTranslateY }] }}>
            <KeurzenMascot expression="happy" size={80} animated />
          </Animated.View>

          {/* Text */}
          <Text style={styles.title}>Tache completee !</Text>
          <Text style={styles.taskName} numberOfLines={2}>
            {taskName}
          </Text>

          {/* Decorative bar */}
          <View style={styles.bar} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default TaskCompletionToast;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayLight,
    zIndex: 999,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm + 2,
    overflow: 'visible',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  taskName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bar: {
    width: 40,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: Spacing.xs,
    marginTop: Spacing.xs,
  },
});
