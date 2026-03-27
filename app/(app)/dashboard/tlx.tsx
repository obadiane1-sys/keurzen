import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCurrentTlx,
  useSubmitTlx,
  useTlxHistory,
  computeTlxScore,
  useTlxDelta,
} from '../../../src/lib/queries/tlx';
import { tlxSchema } from '../../../src/utils/validation';
import { useUiStore } from '../../../src/stores/ui.store';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import type { TlxFormValues } from '../../../src/types';
import dayjs from 'dayjs';

// ─── TLX Dimensions ───────────────────────────────────────────────────────────

const TLX_DIMENSIONS = [
  {
    key: 'mental_demand' as const,
    label: 'Demande mentale',
    description: 'Réflexion, décisions, concentration nécessaires.',
    icon: 'brain-outline' as const,
    color: Colors.lavender,
  },
  {
    key: 'physical_demand' as const,
    label: 'Demande physique',
    description: "Effort physique engagé cette semaine.",
    icon: 'fitness-outline' as const,
    color: Colors.mint,
  },
  {
    key: 'temporal_demand' as const,
    label: 'Pression temporelle',
    description: 'Sentiment d\'urgence ou de manque de temps.',
    icon: 'time-outline' as const,
    color: Colors.coral,
  },
  {
    key: 'performance' as const,
    label: 'Performance',
    description: 'Satisfaction vis-à-vis de vos accomplissements.',
    icon: 'star-outline' as const,
    color: Colors.blue,
    inverted: true,
  },
  {
    key: 'effort' as const,
    label: 'Effort',
    description: 'Intensité du travail fourni, mental ou physique.',
    icon: 'barbell-outline' as const,
    color: Colors.navy,
  },
  {
    key: 'frustration' as const,
    label: 'Frustration',
    description: 'Irritabilité, stress ou tension ressentis.',
    icon: 'sad-outline' as const,
    color: Colors.coral,
  },
];

// ─── Score helpers ─────────────────────────────────────────────────────────────

type ScoreZone = { label: string; color: string; bg: string };

function getScoreZone(score: number): ScoreZone {
  if (score <= 30) return { label: 'Équilibré', color: Colors.mint, bg: Colors.mint + '22' };
  if (score <= 60) return { label: 'Modéré', color: Colors.blue, bg: Colors.blue + '22' };
  if (score <= 80) return { label: 'Élevé', color: Colors.coral, bg: Colors.coral + '22' };
  return { label: 'Critique', color: Colors.error, bg: Colors.error + '22' };
}

// ─── Segmented Dimension Card ──────────────────────────────────────────────────

const SEGMENTS = [
  { value: 0, short: 'Min' },
  { value: 25, short: 'Faible' },
  { value: 50, short: 'Modéré' },
  { value: 75, short: 'Élevé' },
  { value: 100, short: 'Max' },
];

interface TlxCardProps {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  inverted?: boolean;
  value: number;
  onChange: (v: number) => void;
}

function TlxCard({ label, description, icon, color, inverted, value, onChange }: TlxCardProps) {
  // Snap displayed value to nearest segment for indicator alignment
  const displayValue = value;

  return (
    <Card style={styles.dimensionCard}>
      {/* Header */}
      <View style={styles.dimensionHeader}>
        <View style={[styles.dimensionIconBg, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="label">{label}</Text>
          {inverted && (
            <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
              Score inversé — plus haut = meilleur
            </Text>
          )}
        </View>
        <View style={[styles.valuePill, { backgroundColor: color + '18' }]}>
          <Text style={[styles.valueText, { color }]}>{displayValue}</Text>
        </View>
      </View>

      {/* Description */}
      <Text variant="caption" color="secondary" style={styles.dimensionDesc}>
        {description}
      </Text>

      {/* 5-point segmented picker */}
      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => {
          const isSelected = value === seg.value;
          return (
            <TouchableOpacity
              key={seg.value}
              onPress={() => onChange(seg.value)}
              style={styles.segmentItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.segmentDot,
                  {
                    backgroundColor: isSelected ? color : Colors.gray100,
                    borderColor: isSelected ? color : Colors.border,
                    transform: [{ scale: isSelected ? 1.15 : 1 }],
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                )}
              </View>
              <Text
                style={[
                  styles.segmentLabel,
                  { color: isSelected ? color : Colors.textMuted, fontWeight: isSelected ? '600' : '400' },
                ]}
                numberOfLines={1}
              >
                {seg.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: color + 'AA' },
          ]}
        />
      </View>
    </Card>
  );
}

// ─── TLX Explanation Sheet ────────────────────────────────────────────────────

function TlxExplanationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.explanationSheet}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="h3" style={styles.sheetTitle}>
              Comprendre la charge mentale
            </Text>
            <Text variant="body" color="secondary" style={styles.sheetText}>
              Le NASA-TLX (Task Load Index) est un outil scientifique développé par la NASA pour mesurer la charge perçue. Adapté ici au foyer, il vous aide à évaluer objectivement votre ressenti hebdomadaire.
            </Text>
            <Text variant="h4" style={styles.sheetSubtitle}>Les 6 dimensions</Text>
            {TLX_DIMENSIONS.map((dim) => (
              <View key={dim.key} style={styles.sheetDimension}>
                <View style={[styles.dimensionDot, { backgroundColor: dim.color }]} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{dim.label}</Text>
                  <Text variant="bodySmall" color="secondary">{dim.description}</Text>
                </View>
              </View>
            ))}
            <Card style={styles.reassuranceCard}>
              <Ionicons name="heart-outline" size={20} color={Colors.mint} />
              <Text variant="body" style={styles.reassuranceText}>
                {"Ce n'est pas une note de performance. C'est un indicateur d'équilibre et de ressenti."}
              </Text>
            </Card>
            <Button
              label="Fermer"
              variant="ghost"
              fullWidth
              onPress={onClose}
              style={{ marginTop: Spacing.base }}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TlxScreen() {
  const router = useRouter();
  const { showToast } = useUiStore();
  const { data: currentTlx, isLoading } = useCurrentTlx();
  const { data: history = [] } = useTlxHistory();
  const { data: delta } = useTlxDelta();
  const submitTlx = useSubmitTlx();
  const [showExplanation, setShowExplanation] = useState(false);

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<TlxFormValues>({
    resolver: zodResolver(tlxSchema),
    defaultValues: {
      mental_demand: currentTlx?.mental_demand ?? 50,
      physical_demand: currentTlx?.physical_demand ?? 50,
      temporal_demand: currentTlx?.temporal_demand ?? 50,
      performance: currentTlx?.performance ?? 50,
      effort: currentTlx?.effort ?? 50,
      frustration: currentTlx?.frustration ?? 50,
    },
  });

  const values = watch();
  const liveScore = computeTlxScore(values);
  const zone = getScoreZone(liveScore);
  const weekLabel = dayjs().startOf('isoWeek').format('D MMM');

  const onSubmit = async (data: TlxFormValues) => {
    try {
      await submitTlx.mutateAsync(data);
      showToast('Bilan enregistré avec succès ✓', 'success');
      router.back();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
        'error'
      );
    }
  };

  if (isLoading) return <Loader fullScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Bilan de charge"
          rightAction={
            <TouchableOpacity
              onPress={() => setShowExplanation(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="help-circle-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          }
        />

        {/* Hero Score Card */}
        <View style={styles.heroCard}>
          {/* Week label */}
          <Text style={styles.heroWeek}>Semaine du {weekLabel}</Text>

          {/* Score */}
          <View style={styles.heroScoreRow}>
            <Text style={styles.heroScore}>{liveScore}</Text>
            <Text style={styles.heroScoreDenom}>/100</Text>
          </View>

          {/* Zone pill */}
          <View style={[styles.zonePill, { backgroundColor: zone.color + '30' }]}>
            <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
            <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
          </View>

          {/* Delta */}
          {delta?.hasComparison && delta.delta !== null && (
            <View style={styles.heroDelta}>
              <Ionicons
                name={delta.delta > 0 ? 'trending-up' : 'trending-down'}
                size={13}
                color={delta.delta > 0 ? Colors.coral : Colors.mint}
              />
              <Text style={[styles.heroDeltaText, { color: delta.delta > 0 ? Colors.coral : Colors.mint }]}>
                {delta.delta > 0 ? '+' : ''}{delta.delta} pts vs semaine dernière
              </Text>
            </View>
          )}
        </View>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text variant="h4">Évaluez votre semaine</Text>
          <Text variant="caption" color="muted">Ajustez chaque dimension</Text>
        </View>

        {/* Dimension cards */}
        {TLX_DIMENSIONS.map((dim) => (
          <Controller
            key={dim.key}
            control={control}
            name={dim.key}
            render={({ field: { value, onChange } }) => (
              <TlxCard
                label={dim.label}
                description={dim.description}
                icon={dim.icon}
                color={dim.color}
                inverted={dim.inverted}
                value={value}
                onChange={onChange}
              />
            )}
          />
        ))}

        {/* Submit */}
        <Button
          label={currentTlx ? 'Mettre à jour mon bilan' : 'Enregistrer mon bilan'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.sm }}
        />

        {/* History */}
        {history.length > 1 && (
          <Card style={{ marginTop: Spacing.sm }}>
            <Text variant="h4" style={{ marginBottom: Spacing.base }}>
              Historique
            </Text>
            {history.slice(0, 8).map((entry) => {
              const entryZone = getScoreZone(entry.score);
              return (
                <View key={entry.id} style={styles.historyRow}>
                  <Text variant="bodySmall" color="secondary" style={styles.historyDate}>
                    {dayjs(entry.week_start).format('D MMM')}
                  </Text>
                  <View style={styles.historyBarTrack}>
                    <View
                      style={[
                        styles.historyBarFill,
                        { width: `${entry.score}%`, backgroundColor: entryZone.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.historyScore, { color: entryZone.color }]}>
                    {entry.score}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      <TlxExplanationModal
        visible={showExplanation}
        onClose={() => setShowExplanation(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.base,
  },

  // ── Hero card ──
  heroCard: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  heroWeek: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  heroScore: {
    fontSize: 80,
    fontWeight: '800',
    color: Colors.textInverse,
    lineHeight: 88,
  },
  heroScoreDenom: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  heroDeltaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },

  // ── Section header ──
  sectionHeader: {
    gap: 2,
    marginTop: Spacing.xs,
  },

  // ── Dimension card ──
  dimensionCard: {
    gap: Spacing.md,
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dimensionIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    minWidth: 44,
    alignItems: 'center',
  },
  valueText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  dimensionDesc: {
    lineHeight: 18,
    marginTop: -Spacing.xs,
  },

  // ── Segmented picker ──
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  segmentDot: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },

  // ── Progress bar ──
  progressTrack: {
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: -Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  // ── History ──
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 5,
  },
  historyDate: {
    width: 44,
  },
  historyBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  historyBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  historyScore: {
    width: 28,
    textAlign: 'right',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },

  // ── Modal / sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  explanationSheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['3xl'],
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  sheetTitle: {
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  sheetText: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  sheetSubtitle: {
    marginBottom: Spacing.base,
  },
  sheetDimension: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    alignItems: 'flex-start',
  },
  dimensionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  reassuranceCard: {
    backgroundColor: Colors.mint + '15',
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    marginTop: Spacing.base,
  },
  reassuranceText: {
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
