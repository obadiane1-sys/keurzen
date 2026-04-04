import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../ui/Text';
import { useCompleteTaskWithRating } from '../../lib/queries/tasks';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompletionRatingSheetProps {
  visible: boolean;
  taskId: string;
  taskTitle: string;
  onComplete: () => void;
}

// ─── Rating Options ──────────────────────────────────────────────────────────

const RATING_OPTIONS = [
  { value: 1 as const, label: 'Légère', description: 'Rapide et simple', icon: 'leaf-outline' as const, color: Colors.sauge },
  { value: 2 as const, label: 'Moyenne', description: 'Effort modéré', icon: 'time-outline' as const, color: Colors.miel },
  { value: 3 as const, label: 'Lourde', description: 'Demande beaucoup d\'énergie', icon: 'barbell-outline' as const, color: Colors.rose },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Component ───────────────────────────────────────────────────────────────

export function CompletionRatingSheet({
  visible,
  taskId,
  taskTitle,
  onComplete,
}: CompletionRatingSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | null>(null);

  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const completeWithRating = useCompleteTaskWithRating();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setSelectedRating(null);
      Animated.parallel([
        Animated.spring(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetTranslateY, overlayOpacity]);

  const handleRate = (rating: 1 | 2 | 3) => {
    setSelectedRating(rating);
    completeWithRating.mutate(
      { taskId, rating },
      {
        onSuccess: () => onComplete(),
        onError: (err) => {
          setSelectedRating(null);
          Alert.alert('Erreur', err.message);
        },
      }
    );
  };

  if (!visible && !completeWithRating.isPending) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay — NOT touchable */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="none"
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + Spacing.xl,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Title */}
        <Text variant="h4" color="navy" weight="bold" style={styles.title}>
          Comment était cette tâche ?
        </Text>

        {/* Task name */}
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {taskTitle}
        </Text>

        {/* Rating buttons */}
        <View style={styles.buttonsContainer}>
          {RATING_OPTIONS.map((option) => {
            const isSelected = selectedRating === option.value;
            const isDisabled = selectedRating !== null && !isSelected;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.ratingButton, isDisabled && styles.ratingButtonDisabled]}
                activeOpacity={0.7}
                onPress={() => handleRate(option.value)}
                disabled={selectedRating !== null}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} — ${option.description}`}
              >
                {/* Icon circle or loader */}
                {isSelected && completeWithRating.isPending ? (
                  <View style={[styles.iconCircle, { backgroundColor: `${option.color}33` }]}>
                    <ActivityIndicator size="small" color={option.color} />
                  </View>
                ) : (
                  <View style={[styles.iconCircle, { backgroundColor: `${option.color}33` }]}>
                    <Ionicons name={option.icon} size={22} color={option.color} />
                  </View>
                )}

                {/* Label + description */}
                <View style={styles.labelColumn}>
                  <Text variant="body" weight="bold" color="primary">
                    {option.label}
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    minHeight: 64,
    gap: Spacing.base,
  },
  ratingButtonDisabled: {
    opacity: 0.4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelColumn: {
    flex: 1,
  },
});
