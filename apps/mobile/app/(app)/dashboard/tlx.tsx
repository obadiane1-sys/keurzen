import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';

import { Colors, Spacing, BorderRadius, Typography } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import KeurzenMascot, { type MascotExpression } from '../../../src/components/ui/KeurzenMascot';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import {
  useCurrentTlx,
  useSubmitTlx,
  useTlxHistory,
  computeTlxScore,
} from '../../../src/lib/queries/tlx';
import type { TlxFormValues } from '../../../src/types';

// ─── FadeInView helper ──────────────────────────────────────────────────────

function FadeInView({ children, style }: { children: React.ReactNode; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

// ─── Dimension config ────────────────────────────────────────────────────────

const dimensions: { key: keyof TlxFormValues; label: string; description: string; color: string }[] = [
  { key: 'mental_demand', label: 'Exigence mentale', description: 'Reflexion, concentration, memoire requises', color: Colors.prune },
  { key: 'physical_demand', label: 'Exigence physique', description: 'Activite physique necessaire', color: Colors.rose },
  { key: 'temporal_demand', label: 'Pression temporelle', description: 'Sentiment de manquer de temps', color: Colors.miel },
  { key: 'performance', label: 'Performance', description: 'Satisfaction de votre travail (100 = tres satisfait)', color: Colors.sauge },
  { key: 'effort', label: 'Effort', description: 'Intensite de l\'effort fourni', color: Colors.terracotta },
  { key: 'frustration', label: 'Frustration', description: 'Sentiment de decouragement, stress', color: Colors.error },
];

// ─── Level config (reactive mascot) ─────────────────────────────────────────

const LEVEL_CONFIG: Record<1 | 2 | 3, { expression: MascotExpression; label: string; labelColor: string; labelBg: string }> = {
  1: { expression: 'happy', label: 'Super !', labelColor: Colors.greenStrong, labelBg: Colors.sauge + '20' },
  2: { expression: 'normal', label: "C'est note", labelColor: Colors.textSecondary, labelBg: Colors.border },
  3: { expression: 'tired', label: 'Prenez soin de vous', labelColor: Colors.rose, labelBg: Colors.rose + '18' },
};

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score <= 33) return 1;
  if (score <= 66) return 2;
  return 3;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TlxScreen() {
  const router = useRouter();
  const { data: currentTlx, isLoading } = useCurrentTlx();
  const { data: history = [] } = useTlxHistory(8);
  const submitTlx = useSubmitTlx();

  const [values, setValues] = useState<TlxFormValues>({
    mental_demand: currentTlx?.mental_demand ?? 50,
    physical_demand: currentTlx?.physical_demand ?? 50,
    temporal_demand: currentTlx?.temporal_demand ?? 50,
    performance: currentTlx?.performance ?? 50,
    effort: currentTlx?.effort ?? 50,
    frustration: currentTlx?.frustration ?? 50,
  });

  const previewScore = computeTlxScore(values);

  const handleSubmit = async () => {
    try {
      await submitTlx.mutateAsync(values);
      if (Platform.OS === 'web') {
        window.alert('Bilan enregistre !');
      } else {
        Alert.alert('Bilan enregistre', 'Votre score TLX a ete mis a jour.');
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Charge mentale" subtitle="NASA-TLX" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro text */}
        <View style={styles.intro}>
          <Text variant="body" color="secondary" style={styles.introText}>
            {currentTlx
              ? 'Vous avez deja rempli cette semaine. Vous pouvez mettre a jour vos reponses.'
              : 'Evaluez votre charge mentale cette semaine sur chaque dimension (0 = tres faible, 100 = tres forte).'}
          </Text>
        </View>

        {/* Reactive mascot + score preview */}
        {(() => {
          const level = scoreToLevel(previewScore);
          const config = LEVEL_CONFIG[level];
          return (
            <Card padding="md" style={styles.scoreCard}>
              <FadeInView key={level} style={styles.mascotSection}>
                <KeurzenMascot
                  expression={config.expression}
                  size={100}
                  animated
                />
                <View style={[styles.levelBadge, { backgroundColor: config.labelBg }]}>
                  <Text style={[styles.levelBadgeText, { color: config.labelColor }]}>
                    {config.label}
                  </Text>
                </View>
              </FadeInView>

              <Text variant="caption" color="muted">Score prevu</Text>
              <Text variant="h1" style={{ color: tlxColor(previewScore) }}>
                {previewScore}
              </Text>
              <Text variant="caption" color="muted">/100</Text>
            </Card>
          );
        })()}

        {/* Sliders */}
        {dimensions.map((dim) => (
          <Card key={dim.key} padding="md" style={styles.flatCard}>
            <View style={styles.dimHeader}>
              <Text variant="label">{dim.label}</Text>
              <Text variant="h4" style={{ color: dim.color }}>
                {values[dim.key]}
              </Text>
            </View>
            <Text variant="caption" color="muted" style={styles.dimDesc}>
              {dim.description}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={values[dim.key]}
              onValueChange={(v) => setValues((prev) => ({ ...prev, [dim.key]: Math.round(v) }))}
              accessibilityLabel={`${dim.label}, ${values[dim.key]} sur 100`}
              minimumTrackTintColor={dim.color}
              maximumTrackTintColor={Colors.gray200}
              thumbTintColor={dim.color}
            />
            <View style={styles.sliderLabels}>
              <Text variant="caption" color="muted">Tres faible</Text>
              <Text variant="caption" color="muted">Tres forte</Text>
            </View>
          </Card>
        ))}

        {/* Submit */}
        <Button
          label={currentTlx ? 'Mettre a jour' : 'Enregistrer mon bilan'}
          onPress={handleSubmit}
          isLoading={submitTlx.isPending}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />

        {/* History */}
        {history.length > 0 && (
          <>
            <Text variant="overline" color="muted" style={styles.historyLabel}>
              Historique
            </Text>
            {history.map((entry) => (
              <Card key={entry.id} padding="sm" style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Text variant="bodySmall" color="secondary">
                    Sem. {entry.week_start}
                  </Text>
                  <View style={[styles.historyScore, { borderColor: tlxColor(entry.score) }]}>
                    <Text variant="label" style={{ color: tlxColor(entry.score) }}>
                      {entry.score}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function tlxColor(score: number): string {
  if (score <= 33) return Colors.sauge;
  if (score <= 66) return Colors.prune;
  return Colors.rose;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  intro: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  introText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  scoreCard: {
    alignItems: 'center',
    gap: 2,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  mascotSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  levelBadge: {
    borderRadius: BorderRadius.card,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  levelBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  dimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimDesc: {
    marginTop: 2,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: Spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  historyLabel: {
    marginTop: Spacing.xl,
  },
  historyCard: {
    marginBottom: Spacing.xs,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flatCard: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  historyScore: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
