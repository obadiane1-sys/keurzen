import React, { useEffect, useRef } from 'react';
import { StyleSheet, Pressable, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeurzenMascot from '../ui/KeurzenMascot';
import { Text } from '../ui/Text';

// ─── Confetti dots ──────────────────────────────────────────────────────────

const CONFETTI = [
  { color: '#7DCCC3', x: -30, y: -70, size: 10 },
  { color: '#F0A898', x: 20, y: -80, size: 8 },
  { color: '#AFA9EC', x: 45, y: -60, size: 12 },
  { color: '#FAC775', x: -45, y: -55, size: 9 },
  { color: '#9FE1CB', x: 60, y: -75, size: 10 },
  { color: '#F5C4B3', x: -15, y: -85, size: 8 },
  { color: '#CECBF6', x: 35, y: -65, size: 11 },
  { color: '#5DCAA5', x: -55, y: -70, size: 9 },
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
    backgroundColor: 'rgba(250, 248, 244, 0.72)',
    zIndex: 999,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    overflow: 'visible',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  taskName: {
    fontSize: 13,
    color: '#6b6b8a',
    textAlign: 'center',
  },
  bar: {
    width: 40,
    height: 3,
    backgroundColor: '#e0ddd6',
    borderRadius: 4,
    marginTop: 4,
  },
});
