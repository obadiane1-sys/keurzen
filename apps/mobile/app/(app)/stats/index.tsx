import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useStats, type StatsScope, type StatsPeriod } from '@keurzen/queries';
import { Colors, Spacing, Typography } from '../../../src/constants/tokens';
import { StatsHeader } from '../../../src/components/stats/StatsHeader';
import { ScoreHero } from '../../../src/components/stats/ScoreHero';
import { KpiGrid } from '../../../src/components/stats/KpiGrid';
import { MemberBalanceList } from '../../../src/components/stats/MemberBalanceList';
import { TrendChart } from '../../../src/components/stats/TrendChart';
import { AnimatedScreen } from '../../../src/components/ui/AnimatedScreen';
import { Skeleton } from '../../../src/components/ui/Skeleton';

export default function StatsScreen() {
  const [scope, setScope] = useState<StatsScope>('me');
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const stats = useStats({ scope, period });

  const showHouseholdBlocks = scope === 'household';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Statistiques</Text>
      </View>

      <StatsHeader
        scope={scope}
        period={period}
        onScopeChange={setScope}
        onPeriodChange={setPeriod}
      />

      <AnimatedScreen>
      <ScrollView contentContainerStyle={styles.scroll}>
        {stats.isLoading ? (
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Skeleton width={100} height={56} />
              <Skeleton width={160} height={14} />
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><Skeleton height={80} borderRadius={24} /></View>
              <View style={{ flex: 1 }}><Skeleton height={80} borderRadius={24} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}><Skeleton height={80} borderRadius={24} /></View>
              <View style={{ flex: 1 }}><Skeleton height={80} borderRadius={24} /></View>
            </View>
          </View>
        ) : stats.isEmpty ? (
          <EmptyState
            variant="generic"
            title="Pas encore de donnees"
            subtitle="Complete quelques taches et tes statistiques s'afficheront ici."
          />
        ) : (
          <>
            {showHouseholdBlocks && stats.score && (
              <ScoreHero
                score={stats.score.total}
                delta={stats.scoreDelta}
                coachMessage={stats.coachMessage}
              />
            )}
            <KpiGrid kpis={stats.kpis} />
            {showHouseholdBlocks && stats.trend.length > 0 && (
              <TrendChart points={stats.trend} title="Tâches par semaine" />
            )}
            {showHouseholdBlocks && stats.members.length > 0 && (
              <MemberBalanceList members={stats.members} />
            )}
          </>
        )}
      </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
  },
  scroll: {
    paddingBottom: 96,
  },
});
