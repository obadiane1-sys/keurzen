import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Mascot } from '../ui/Mascot';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';
import { useWeeklyReport, useRegenerateReport } from '../../lib/queries/reports';
import type { AttentionPoint, Insight, Orientation } from '../../types';

// ─── Section Header (collapsible) ──────────────────────────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────

export function WeeklyReportCard() {
  const router = useRouter();
  const { data: report, isLoading, error } = useWeeklyReport();
  const regenerate = useRegenerateReport();

  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    insights: false,
    orientations: false,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Loading state ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card padding="lg" radius="xl">
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '80%' }]} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
      </Card>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <Card padding="lg" radius="xl">
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={32} color={Colors.textMuted} />
          <Text variant="body" color="muted" style={styles.stateText}>
            Impossible de charger le rapport
          </Text>
          <TouchableOpacity
            onPress={() => regenerate.mutate()}
            style={styles.retryBtn}
            disabled={regenerate.isPending}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  // ─── No report state ──────────────────────────────────────────────────
  if (!report) {
    return (
      <Card padding="lg" radius="xl">
        <View style={styles.stateContainer}>
          <Mascot size={48} expression="calm" />
          <Text variant="body" color="muted" style={styles.stateText}>
            Pas encore de rapport cette semaine
          </Text>
          <TouchableOpacity
            onPress={() => regenerate.mutate()}
            style={styles.generateBtn}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Text style={styles.generateBtnText}>Générer le rapport</Text>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  // ─── Report state ─────────────────────────────────────────────────────

  const weekLabel = new Date(report.week_start).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <Card padding="none" radius="xl">
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(app)/dashboard/weekly-review')}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart-outline" size={20} color={Colors.prune} />
          <View>
            <Text style={styles.headerTitle}>Rapport de la semaine</Text>
            <Text style={styles.headerWeek}>Semaine du {weekLabel}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>{report.summary}</Text>
      </View>

      {/* Attention Points */}
      {report.attention_points.length > 0 && (
        <>
          <View style={styles.divider} />
          <SectionHeader
            icon="warning-outline"
            iconColor={Colors.rose}
            title="Points d'attention"
            count={report.attention_points.length}
            expanded={expandedSections.attention}
            onToggle={() => toggleSection('attention')}
          />
          {expandedSections.attention && (
            <View style={styles.sectionContent}>
              {report.attention_points.map((item: AttentionPoint, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <Ionicons
                    name={(item.icon ?? 'alert-circle') as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={item.level === 'warning' ? Colors.rose : Colors.miel}
                  />
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Insights */}
      {report.insights.length > 0 && (
        <>
          <View style={styles.divider} />
          <SectionHeader
            icon="lightbulb-outline"
            iconColor={Colors.prune}
            title="Insights"
            count={report.insights.length}
            expanded={expandedSections.insights}
            onToggle={() => toggleSection('insights')}
          />
          {expandedSections.insights && (
            <View style={styles.sectionContent}>
              {report.insights.map((item: Insight, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <Ionicons name="lightbulb-outline" size={16} color={Colors.prune} />
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Orientations */}
      {report.orientations.length > 0 && (
        <>
          <View style={styles.divider} />
          <SectionHeader
            icon="compass-outline"
            iconColor={Colors.sauge}
            title="Orientations"
            count={report.orientations.length}
            expanded={expandedSections.orientations}
            onToggle={() => toggleSection('orientations')}
          />
          {expandedSections.orientations && (
            <View style={styles.sectionContent}>
              {report.orientations.map((item: Orientation, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <View style={[
                    styles.bulletDot,
                    { backgroundColor: item.priority === 'high' ? Colors.sauge : Colors.textMuted },
                  ]} />
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Regenerate button */}
      <View style={styles.divider} />
      <TouchableOpacity
        style={styles.regenerateBtn}
        onPress={() => regenerate.mutate()}
        disabled={regenerate.isPending}
        activeOpacity={0.7}
      >
        {regenerate.isPending ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <>
            <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.regenerateText}>Regénérer le rapport</Text>
          </>
        )}
      </TouchableOpacity>
    </Card>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as TextStyle['fontWeight'],
    color: Colors.textPrimary,
  },
  headerWeek: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Summary
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.base * 1.5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  // Section header
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

  // Section content
  sectionContent: {
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

  // Regenerate
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

  // States
  stateContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
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
    color: Colors.terracotta,
  },
  generateBtn: {
    backgroundColor: Colors.prune,
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

  // Skeleton
  skeletonContainer: {
    gap: Spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray100,
    width: '100%',
  },
});
