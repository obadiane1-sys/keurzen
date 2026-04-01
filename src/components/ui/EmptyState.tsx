import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Animated } from 'react-native';
import KeurzenMascot, { type MascotExpression } from './KeurzenMascot';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from './Text';

type EmptyStateVariant = 'tasks' | 'calendar' | 'tlx' | 'budget' | 'dashboard' | 'household' | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  expression?: MascotExpression;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

const variantDefaults: Record<EmptyStateVariant, { title: string; subtitle: string; ctaLabel?: string; expression: MascotExpression }> = {
  tasks: {
    title: 'Tout est calme ici',
    subtitle: 'Ajoutez une premiere tache a votre foyer.',
    ctaLabel: 'Ajouter une tache',
    expression: 'normal',
  },
  calendar: {
    title: 'Aucune tache ce jour',
    subtitle: 'Les taches avec une echeance ce jour apparaitront ici.',
    expression: 'normal',
  },
  tlx: {
    title: 'Pas encore de bilan',
    subtitle: 'Enregistrez votre charge mentale chaque semaine pour suivre votre equilibre.',
    ctaLabel: 'Faire mon bilan',
    expression: 'tired',
  },
  budget: {
    title: 'Aucune depense enregistree',
    subtitle: 'Commencez a suivre vos depenses pour voir la repartition budgetaire.',
    ctaLabel: 'Ajouter une depense',
    expression: 'normal',
  },
  dashboard: {
    title: 'Bienvenue dans Keurzen !',
    subtitle: 'Votre tableau de bord se remplira au fil de vos activites.',
    ctaLabel: 'Ajouter une tache',
    expression: 'happy',
  },
  household: {
    title: 'Votre foyer vous attend',
    subtitle: 'Creez ou rejoignez un foyer pour commencer.',
    ctaLabel: 'Creer un foyer',
    expression: 'normal',
  },
  generic: {
    title: 'Rien ici pour l\'instant',
    subtitle: 'Les donnees apparaitront bientot.',
    expression: 'normal',
  },
};

export function EmptyState({
  variant = 'generic',
  expression,
  title,
  subtitle,
  ctaLabel,
  onCta,
  action,
  style,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const displayTitle = title ?? defaults.title;
  const displaySubtitle = subtitle ?? defaults.subtitle;
  const displayExpression = expression ?? defaults.expression;

  // Support both old (ctaLabel+onCta) and new (action) API
  const actionLabel = action?.label ?? ctaLabel ?? defaults.ctaLabel;
  const actionOnPress = action?.onPress ?? onCta;

  // ZoomIn animation for mascot
  const mascotScale = useRef(new Animated.Value(0)).current;
  // FadeIn animation for text
  const textOpacity = useRef(new Animated.Value(0)).current;
  // FadeIn animation for CTA
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mascot zoom in (350ms)
    Animated.timing(mascotScale, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Text fade in (delay 200ms, duration 300ms)
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 300,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // CTA fade in (delay 400ms, duration 300ms)
    Animated.timing(ctaOpacity, {
      toValue: 1,
      duration: 300,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, [mascotScale, textOpacity, ctaOpacity]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
        <KeurzenMascot
          expression={displayExpression}
          size={140}
          animated
        />
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.title}>{displayTitle}</Text>
        {displaySubtitle ? (
          <Text style={styles.subtitle}>{displaySubtitle}</Text>
        ) : null}
      </Animated.View>

      {actionLabel && actionOnPress ? (
        <Animated.View style={{ opacity: ctaOpacity }}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={actionOnPress}
            activeOpacity={0.85}
          >
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  textWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.navy,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.navy + '99',
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
    lineHeight: 22,
  },
  actionBtn: {
    marginTop: Spacing['2xl'],
    backgroundColor: Colors.coral,
    borderRadius: 24,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  actionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
