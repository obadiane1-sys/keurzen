import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  KeyboardAvoidingView,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../../src/components/ui/Text';
import { useCreateList } from '../../../src/lib/queries/lists';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import type { SharedListType } from '../../../src/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const DISMISS_THRESHOLD = 100;

const TYPE_CHIPS: {
  value: SharedListType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'shopping', label: 'Courses', icon: 'cart-outline', color: Colors.sauge },
  { value: 'todo', label: 'Todo', icon: 'checkmark-circle-outline', color: Colors.prune },
  { value: 'custom', label: 'Perso', icon: 'list-outline', color: Colors.miel },
];

const ICON_CHOICES: (keyof typeof Ionicons.glyphMap)[] = [
  'cart-outline',
  'checkmark-circle-outline',
  'list-outline',
  'home-outline',
  'briefcase-outline',
  'heart-outline',
  'star-outline',
  'gift-outline',
];

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function CreateListScreen() {
  const router = useRouter();
  const createList = useCreateList();

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SharedListType>('shopping');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // ─── Bottom sheet animation ─────────────────────────────────────────────

  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
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
  }, [sheetTranslateY, overlayOpacity]);

  const closeSheet = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
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
    ]).start(() => {
      router.back();
    });
  }, [sheetTranslateY, overlayOpacity, router]);

  const closeSheetRef = useRef(closeSheet);
  useEffect(() => {
    closeSheetRef.current = closeSheet;
  }, [closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (closingRef.current) return;
        if (gestureState.dy > DISMISS_THRESHOLD) {
          closeSheetRef.current();
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      const newList = await createList.mutateAsync({
        title: title.trim(),
        type,
        icon: selectedIcon ?? undefined,
        color: selectedColor ?? undefined,
      });
      closeSheet();
      // Navigate after sheet closes (setTimeout to let animation finish)
      setTimeout(() => {
        router.push(`/(app)/lists/${newList.id}`);
      }, 300);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  const isDisabled = !title.trim();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.fullScreen}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {/* Handle area */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>

          {/* Sheet body */}
          <ScrollView
            style={styles.sheetBody}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Title input */}
            <View style={styles.titleWrapper}>
              <TextInput
                style={styles.titleInput}
                placeholder="Nom de la liste..."
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
                returnKeyType="done"
              />
            </View>

            {/* Type selector */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionLabel}>
                Type
              </Text>
              <View style={styles.typeRow}>
                {TYPE_CHIPS.map((chip) => {
                  const active = type === chip.value;
                  return (
                    <TouchableOpacity
                      key={chip.value}
                      onPress={() => setType(chip.value)}
                      style={[
                        styles.typeChip,
                        active
                          ? { backgroundColor: chip.color + '33', borderColor: chip.color }
                          : { backgroundColor: Colors.backgroundCard, borderColor: Colors.border },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={chip.icon}
                        size={16}
                        color={active ? chip.color : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: active ? chip.color : Colors.textSecondary },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Icon selector */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionLabel}>
                Icone
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconRow}
              >
                {ICON_CHOICES.map((iconName) => {
                  const active = selectedIcon === iconName;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      onPress={() => setSelectedIcon(active ? null : iconName)}
                      style={[
                        styles.iconCircle,
                        active && styles.iconCircleActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={active ? Colors.textPrimary : Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Color selector */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionLabel}>
                Couleur
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
              >
                {Colors.memberColors.map((color) => {
                  const active = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(active ? null : color)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        active && styles.colorCircleActive,
                      ]}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>

          {/* CTA */}
          <SafeAreaView edges={['bottom']} style={styles.ctaSafe}>
            <TouchableOpacity
              style={[styles.ctaButton, isDisabled && styles.ctaButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isDisabled || createList.isPending}
            >
              {createList.isPending ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <Text style={styles.ctaText}>Créer la liste</Text>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },

  // Keyboard avoid
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Sheet
  sheet: {
    maxHeight: SHEET_MAX_HEIGHT,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.lg,
  },

  // Handle
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
  },

  // Sheet body
  sheetBody: {
    flexShrink: 1,
  },
  sheetContent: {
    paddingBottom: Spacing.lg,
  },

  // Title
  titleWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  titleInput: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    padding: 0,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Type selector
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
  },

  // Icon selector
  iconRow: {
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconCircleActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.gray50,
  },

  // Color selector
  colorRow: {
    gap: Spacing.sm,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: Colors.backgroundCard,
    transform: [{ scale: 1.1 }],
    ...Shadows.sm,
  },

  // CTA
  ctaSafe: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
    height: 48,
    ...Shadows.sm,
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});
