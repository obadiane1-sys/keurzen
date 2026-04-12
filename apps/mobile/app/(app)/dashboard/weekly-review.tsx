import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { Card } from '../../../src/components/ui/Card';
import { Text } from '../../../src/components/ui/Text';
import { Mascot } from '../../../src/components/ui/Mascot';
import { Loader } from '../../../src/components/ui/Loader';
// CircularGauge removed — will be redesigned
import {
  useWeeklyReview,
  useWeeklyReviewHistory,
  useRegenerateReport,
} from '../../../src/lib/queries/reports';
import type { WeeklyReviewSummary } from '../../../src/lib/queries/reports';
import type { AttentionPoint, Insight, Orientation, MemberMetric } from '../../../src/types';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '../../../src/constants/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMascotExpression(score: number | null): 'happy' | 'calm' | 'sleepy' {
  if (score === null) return 'calm';
  if (score >= 75) return 'happy';
  if (score >= 50) return 'calm';
  return 'sleepy';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '—';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Correct';
  return 'À améliorer';
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function formatWeekDate(weekStart: string): string {
  return new Date(weekStart).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function SectionHeader({
  icon,
  iconColor,
  title,
  count,
  expanded,
  onToggle,
}: {
  icon: string;
  iconColor: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({count})</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={14}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Member Bar ───────────────────────────────────────────────────────────────

function MemberBar({ member, index }: { member: MemberMetric; index: number }) {
  const color = Colors.memberColors[index % Colors.memberColors.length];
  const sharePercent = Math.round(member.tasks_share * 100);

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        <View style={[styles.memberDot, { backgroundColor: color }]} />
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberStat}>
          {member.tasks_count} tâche{member.tasks_count !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${sharePercent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.memberPercent}>{sharePercent}%</Text>
    </View>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({
  item,
  onPress,
}: {
  item: WeeklyReviewSummary;
  onPress: () => void;
}) {
  const score = item.balance_score !== null ? Math.round(item.balance_score) : null;
  const scoreColor = score !== null
    ? score >= 75 ? Colors.success : score >= 50 ? Colors.joy : Colors.accent
    : Colors.textMuted;

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.historyDate}>Sem. du {formatWeekDate(item.week_start)}</Text>
      <View style={styles.historyRight}>
        {score !== null && (
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{score}</Text>
          </View>
        )}
        <Text style={styles.historyTasks}>{item.total_tasks_completed} tâches</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WeeklyReviewScreen() {
  const { week } = useLocalSearchParams<{ week?: string }>();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(week);

  const { data: review, isLoading, error, refetch } = useWeeklyReview(selectedWeek);
  const { data: history = [] } = useWeeklyReviewHistory(8);
  const regenerate = useRegenerateReport();

  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    insights: true,
    orientations: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <Loader fullScreen />
      </SafeAreaView>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
          <Text variant="body" color="muted" style={styles.stateText}>
            Impossible de charger le bilan
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty ──────────────────────────────────────────────────────────
  if (!review) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Bilan de la semaine" />
        <View style={styles.centerState}>
          <Mascot size={80} expression="calm" />
          <Text variant="body" color="muted" style={styles.stateText}>
            Pas encore de bilan cette semaine
          </Text>
          <TouchableOpacity
            onPress={() => regenerate.mutate()}
            style={styles.generateBtn}
            disabled={regenerate.isPending}
          >
            <Text style={styles.generateBtnText}>
              {regenerate.isPending ? 'Génération…' : 'Générer le bilan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Review content ─────────────────────────────────────────────────
  const balanceScore = review.balance_score !== null ? Math.round(review.balance_score) : null;
  const hasMetrics = review.balance_score !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Bilan de la semaine"
        subtitle={`Semaine du ${formatWeekDate(review.week_start)}`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Score + Mascot ─────────────────────────────────────── */}
        {hasMetrics && (
          <Card padding="lg" radius="xl" style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBadgeLarge}>
                <Text style={styles.scoreBadgeLargeValue}>{balanceScore}</Text>
                <Text style={styles.scoreBadgeLargeUnit}>/100</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Mascot
                  size={56}
                  expression={getMascotExpression(balanceScore)}
                />
                <Text style={styles.scoreLabel}>{getScoreLabel(balanceScore)}</Text>
                <Text style={styles.scoreSubtitle}>Équilibre du foyer</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── Key Metrics ────────────────────────────────────────── */}
        {hasMetrics && (
          <View style={styles.metricsRow}>
            <MetricCard
              icon="checkmark-done-outline"
              iconColor={Colors.success}
              value={String(review.total_tasks_completed)}
              label="Tâches"
            />
            <MetricCard
              icon="time-outline"
              iconColor={Colors.primary}
              value={formatMinutes(review.total_minutes_logged)}
              label="Temps"
            />
            <MetricCard
              icon="pulse-outline"
              iconColor={Colors.primary}
              value={review.avg_tlx_score !== null ? String(Math.round(review.avg_tlx_score)) : '—'}
              label="TLX moy."
            />
          </View>
        )}

        {/* ── Member Breakdown ───────────────────────────────────── */}
        {hasMetrics && review.member_metrics.length > 0 && (
          <Card padding="lg" radius="xl" style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Répartition par membre</Text>
            <View style={styles.membersContainer}>
              {review.member_metrics.map((m, i) => (
                <MemberBar key={m.user_id} member={m} index={i} />
              ))}
            </View>
          </Card>
        )}

        {/* ── AI Report: Summary ─────────────────────────────────── */}
        <Card padding="none" radius="xl" style={styles.sectionCard}>
          <View style={styles.reportHeader}>
            <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Rapport IA</Text>
          </View>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{review.summary}</Text>
          </View>

          {/* Attention Points */}
          {review.attention_points.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="warning-outline"
                iconColor={Colors.accent}
                title="Points d'attention"
                count={review.attention_points.length}
                expanded={expandedSections.attention}
                onToggle={() => toggleSection('attention')}
              />
              {expandedSections.attention && (
                <View style={styles.aiSectionContent}>
                  {review.attention_points.map((item: AttentionPoint, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Ionicons
                        name={(item.icon ?? 'alert-circle') as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={item.level === 'warning' ? Colors.accent : Colors.joy}
                      />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Insights */}
          {review.insights.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="lightbulb-outline"
                iconColor={Colors.primary}
                title="Insights"
                count={review.insights.length}
                expanded={expandedSections.insights}
                onToggle={() => toggleSection('insights')}
              />
              {expandedSections.insights && (
                <View style={styles.aiSectionContent}>
                  {review.insights.map((item: Insight, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Ionicons name="lightbulb-outline" size={16} color={Colors.primary} />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Orientations */}
          {review.orientations.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionHeader
                icon="compass-outline"
                iconColor={Colors.success}
                title="Orientations"
                count={review.orientations.length}
                expanded={expandedSections.orientations}
                onToggle={() => toggleSection('orientations')}
              />
              {expandedSections.orientations && (
                <View style={styles.aiSectionContent}>
                  {review.orientations.map((item: Orientation, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <View style={[
                        styles.bulletDot,
                        { backgroundColor: item.priority === 'high' ? Colors.success : Colors.textMuted },
                      ]} />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Regenerate */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.regenerateText}>
              {regenerate.isPending ? 'Régénération…' : 'Regénérer le rapport'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── History ────────────────────────────────────────────── */}
        {history.length > 1 && (
          <Card padding="lg" radius="xl" style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Historique</Text>
            <View style={styles.historyList}>
              {history
                .filter(h => h.week_start !== review.week_start)
                .map(item => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onPress={() => setSelectedWeek(item.week_start)}
                  />
                ))}
            </View>
          </Card>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },

  // Inline score badge (placeholder for CircularGauge)
  scoreBadgeLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeLargeValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  scoreBadgeLargeUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Score card
  scoreCard: {
    marginBottom: Spacing.base,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreInfo: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  scoreSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  metricValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Section card
  sectionCard: {
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Member bars
  membersContainer: {
    gap: Spacing.md,
  },
  memberRow: {
    gap: Spacing.xs,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  memberName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
    flex: 1,
  },
  memberStat: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  memberPercent: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textAlign: 'right',
    width: 36,
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // AI Report
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  aiSectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  regenerateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // History
  historyList: {
    gap: Spacing.xs,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: 44,
  },
  historyDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  scoreBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
  },
  historyTasks: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // States
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as TextStyle['fontWeight'],
    color: Colors.primary,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textInverse,
  },
});
