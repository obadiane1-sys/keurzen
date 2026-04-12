import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Mascot } from '../../../src/components/ui/Mascot';
import { useAuthStore } from '../../../src/stores/auth.store';
import { markOnboardingSeen } from '../../../src/lib/supabase/auth';
import { supabase } from '../../../src/lib/supabase/client';

// ─── Step Definitions ────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

interface StepOption {
  emoji: string;
  label: string;
  value: string;
}

interface StepDef {
  question: string;
  options: StepOption[];
}

const STEPS: StepDef[] = [
  {
    question: 'Comment est compose votre foyer ?',
    options: [
      { emoji: '🧑', label: 'Je vis seul·e', value: 'solo' },
      { emoji: '👫', label: 'En couple', value: 'couple' },
      { emoji: '👨‍👩‍👧', label: 'Famille avec enfants', value: 'family' },
      { emoji: '👨‍👩‍👧‍👦', label: 'Grande famille', value: 'large_family' },
    ],
  },
  {
    question: 'Qui gere le foyer aujourd\'hui ?',
    options: [
      { emoji: '💪', label: 'Principalement moi', value: 'mainly_me' },
      { emoji: '🤝', label: 'On se partage equitablement', value: 'equal' },
      { emoji: '🔄', label: 'Ca varie beaucoup', value: 'varies' },
      { emoji: '🆕', label: 'On commence a s\'organiser', value: 'starting' },
    ],
  },
  {
    question: 'Qu\'est-ce qui vous prend le plus d\'energie ?',
    options: [
      { emoji: '🛒', label: 'Les courses et repas', value: 'meals' },
      { emoji: '🧹', label: 'Les taches menageres', value: 'chores' },
      { emoji: '📅', label: 'L\'organisation generale', value: 'planning' },
      { emoji: '💰', label: 'Les finances du foyer', value: 'finances' },
    ],
  },
  {
    question: 'Qu\'attendez-vous de Keurzen ?',
    options: [
      { emoji: '🧘', label: 'Me decharger l\'esprit', value: 'mental_relief' },
      { emoji: '👁️', label: 'Avoir une vue d\'ensemble', value: 'overview' },
      { emoji: '⚖️', label: 'Mieux equilibrer avec mon partenaire', value: 'balance' },
      { emoji: '⚡', label: 'Gagner du temps au quotidien', value: 'save_time' },
    ],
  },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<(string | null)[]>([null, null, null, null]);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isCompletion = currentStep === TOTAL_STEPS;
  const currentSelection = selections[currentStep] ?? null;

  // ─── Fade transition ───────────────────────────────────────────────────────

  const animateToStep = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = (value: string) => {
    const next = [...selections];
    next[currentStep] = value;
    setSelections(next);
  };

  const handleContinue = () => {
    animateToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  };

  const finishOnboarding = async (savePreferences: boolean) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      if (savePreferences) {
        const [householdType, currentSplit, painPoint, mainGoal] = selections;
        if (householdType && currentSplit && painPoint && mainGoal) {
          await supabase.from('onboarding_preferences').upsert(
            {
              user_id: user.id,
              household_type: householdType,
              current_split: currentSplit,
              pain_point: painPoint,
              main_goal: mainGoal,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        }
      }

      await markOnboardingSeen(user.id);

      if (profile) {
        setProfile({ ...profile, has_seen_onboarding: true });
      }
    } catch {
      // Best-effort — proceed to dashboard regardless
    } finally {
      setIsLoading(false);
      router.replace('/(app)/dashboard');
    }
  };

  const handleSkip = () => {
    finishOnboarding(false);
  };

  const handleComplete = () => {
    finishOnboarding(true);
  };

  // ─── Completion screen ────────────────────────────────────────────────────

  if (isCompletion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.centered, { opacity: fadeAnim }]}>
          <Mascot size={120} expression="happy" />

          <Text variant="h2" style={styles.completionTitle}>
            Tout est pret !
          </Text>

          <Text variant="body" color="secondary" style={styles.completionSubtitle}>
            Keurzen est configure pour votre foyer.{'\n'}
            Vous pouvez tout ajuster depuis les parametres.
          </Text>

          <Button
            label="Decouvrir Keurzen"
            onPress={handleComplete}
            isLoading={isLoading}
            fullWidth
            size="lg"
            style={styles.completionCta}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ─── Selection steps ──────────────────────────────────────────────────────

  const step = STEPS[currentStep];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= currentStep ? Colors.primary : Colors.borderLight },
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <Text variant="caption" color="muted">
          {currentStep + 1} / {TOTAL_STEPS}
        </Text>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipHeaderBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="bodySmall" color="muted">Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question */}
          <Text variant="h3" style={styles.question}>
            {step.question}
          </Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {step.options.map((option) => {
              const isSelected = currentSelection === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'regular'}
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA */}
          <Button
            label="Continuer"
            onPress={handleContinue}
            disabled={!currentSelection}
            fullWidth
            size="lg"
            style={styles.continueBtn}
          />

          <TouchableOpacity onPress={handleSkip} style={styles.skipBottomBtn}>
            <Text variant="bodySmall" color="muted">Passer cette etape</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
  },

  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  backBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  skipHeaderBtn: {
    minWidth: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },

  // Question
  question: {
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.fontSize['2xl'] * 1.3,
  },

  // Options
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    minHeight: TouchTarget.min,
    ...Shadows.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },
  optionEmoji: {
    fontSize: Typography.fontSize['2xl'],
  },
  optionLabel: {
    flex: 1,
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },

  // CTA
  continueBtn: {
    marginBottom: Spacing.md,
  },
  skipBottomBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  // Completion
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },
  completionTitle: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  completionSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.base,
  },
  completionCta: {
    marginTop: Spacing.xl,
    width: '100%',
  },
});
