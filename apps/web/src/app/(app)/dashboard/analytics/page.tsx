'use client';

import { useRouter } from 'next/navigation';
import { useWeeklyBalance, useCoachingInsights } from '@keurzen/queries';

import { ScoreBreakdownCard } from '@/components/analytics/ScoreBreakdownCard';
import { EquitySection } from '@/components/analytics/EquitySection';
import { TlxDetailSection } from '@/components/analytics/TlxDetailSection';
import { TrendsSection } from '@/components/analytics/TrendsSection';
// InsightCard removed — will be redesigned

export default function AnalyticsPage() {
  const router = useRouter();
  const { members } = useWeeklyBalance();
  const { data: insights = [] } = useCoachingInsights();

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-border-light transition-colors"
        >
          <span className="text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold text-text-primary">
          Analyse de la semaine
        </h1>
      </div>

      <ScoreBreakdownCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <TlxDetailSection />

      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Conseils du coach
        </p>
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="py-2 px-3 border-b border-border-light last:border-b-0">
                <p className="text-sm text-text-secondary">
                  {insight.text ?? insight.message ?? String(insight.id)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            Tout va bien ! Aucun conseil pour le moment.
          </p>
        )}
      </div>

      <TrendsSection />

      <button
        onClick={() => router.push('/dashboard/weekly-review')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-background-card shadow-card hover:opacity-90 transition-opacity"
      >
        <span>📄</span>
        <span className="text-sm font-semibold text-terracotta">
          Voir le rapport IA de la semaine
        </span>
        <span className="text-terracotta">→</span>
      </button>

      <div className="h-8" />
    </div>
  );
}
