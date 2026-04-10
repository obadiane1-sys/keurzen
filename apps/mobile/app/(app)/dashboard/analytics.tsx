import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../src/components/ui/Text';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/tokens';
import { useWeeklyBalance, useCoachingInsights } from '@keurzen/queries';

import { ScoreBreakdownCard } from '../../src/components/analytics/ScoreBreakdownCard';
import { EquitySection } from '../../src/components/analytics/EquitySection';
import { TlxDetailSection } from '../../src/components/analytics/TlxDetailSection';
import { TrendsSection } from '../../src/components/analytics/TrendsSection';
import { InsightCard } from '../../src/components/dashboard/InsightCard';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { members } = useWeeklyBalance();
  const { data: insights = [] } = useCoachingInsights();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Analyse de la semaine
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScoreBreakdownCard />

        <EquitySection
          title="Repartition des taches"
          members={members}
          shareKey="tasksShare"
          deltaKey="tasksDelta"
        />

        <EquitySection
          title="Repartition du temps"
          members={members}
          shareKey="minutesShare"
          deltaKey="minutesDelta"
        />

        <TlxDetailSection />

        <View style={styles.section}>
          <Text variant="bodySmall" weight="bold" style={styles.sectionTitle}>
            Conseils du coach
          </Text>
          {insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          ) : (
            <View style={styles.insightFallback}>
              <Text variant="bodySmall" color="muted">
                Tout va bien ! Aucun conseil pour le moment.
              </Text>
            </View>
          )}
        </View>

        <TrendsSection />

        <TouchableOpacity
          style={styles.weeklyReviewLink}
          onPress={() => router.push('/(app)/dashboard/weekly-review')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={18} color={Colors.terracotta} />
          <Text variant="bodySmall" weight="semibold" style={styles.weeklyReviewText}>
            Voir le rapport IA de la semaine
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.terracotta} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  section: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightFallback: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  weeklyReviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  weeklyReviewText: {
    color: Colors.terracotta,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
