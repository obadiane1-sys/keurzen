import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Animated, TouchableOpacity, View } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows, Typography } from '../../constants/tokens';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useUiStore } from '../../stores/ui.store';

const typeConfig = {
  success: {
    accent: Colors.sauge,
    icon: 'checkmark-circle' as const,
    iconColor: Colors.sauge,
  },
  error: {
    accent: Colors.rose,
    icon: 'alert-circle' as const,
    iconColor: Colors.rose,
  },
  info: {
    accent: Colors.miel,
    icon: 'information-circle' as const,
    iconColor: Colors.miel,
  },
};

export function Toast() {
  const { activeToast, hideToast } = useUiStore();
  const opacity = useMemo(() => new Animated.Value(0), []);
  const translateY = useMemo(() => new Animated.Value(-16), []);

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
        ]).start(() => hideToast());
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const cfg = typeConfig[activeToast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
        Shadows.lg,
      ]}
      pointerEvents="box-none"
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: cfg.accent }]} />

      {/* Icon */}
      <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />

      {/* Message */}
      <Text
        style={styles.message}
        numberOfLines={2}
      >
        {activeToast.message}
      </Text>

      {/* Dismiss */}
      <TouchableOpacity
        onPress={hideToast}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.close}
        accessibilityLabel="Fermer la notification"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.base,
    zIndex: 9999,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    paddingLeft: Spacing.xs,
  },
  close: {
    padding: Spacing.xs,
    minWidth: 28,
    alignItems: 'center',
  },
});
