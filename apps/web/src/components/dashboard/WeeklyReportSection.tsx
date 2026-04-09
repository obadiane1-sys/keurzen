'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWeeklyReport } from '@keurzen/queries';
import { Card } from '@/components/ui/Card';

export function WeeklyReportSection() {
  const router = useRouter();
  const { data: report, isLoading } = useWeeklyReport();
  const [expanded, setExpanded] = useState({
    attention: false,
    insights: false,
    orientations: false,
  });

  const toggle = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading || !report) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Rapport de la semaine
        </p>
        <button
          onClick={() => router.push('/dashboard/weekly-review')}
          className="text-xs font-medium text-terracotta hover:underline"
        >
          Voir le bilan complet
        </button>
      </div>
      <Card className="!p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <BarChart3 size={16} className="text-prune" />
          <span className="text-sm font-bold text-text-primary">Rapport IA</span>
        </div>

        {/* Summary */}
        <p className="px-4 pb-3 text-sm text-text-secondary leading-relaxed">
          {report.summary}
        </p>

        {/* Attention points */}
        {report.attention_points.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('attention')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <AlertTriangle size={14} className="text-miel shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">
                Points d&apos;attention
              </span>
              <span className="text-xs text-text-muted">({report.attention_points.length})</span>
              {expanded.attention
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.attention && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.attention_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={12} className="mt-0.5 text-miel shrink-0" />
                    <p className="text-sm text-text-secondary">{point.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Insights */}
        {report.insights.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('insights')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <Lightbulb size={14} className="text-prune shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">Insights</span>
              <span className="text-xs text-text-muted">({report.insights.length})</span>
              {expanded.insights
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.insights && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lightbulb size={12} className="mt-0.5 text-prune shrink-0" />
                    <p className="text-sm text-text-secondary">{insight.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Orientations */}
        {report.orientations.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <button
              onClick={() => toggle('orientations')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
            >
              <Compass size={14} className="text-terracotta shrink-0" />
              <span className="flex-1 text-xs font-semibold text-text-secondary">Orientations</span>
              <span className="text-xs text-text-muted">({report.orientations.length})</span>
              {expanded.orientations
                ? <ChevronUp size={12} className="text-text-muted" />
                : <ChevronDown size={12} className="text-text-muted" />}
            </button>
            {expanded.orientations && (
              <div className="px-4 pb-3 space-y-1.5">
                {report.orientations.map((orientation, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Compass size={12} className="mt-0.5 text-terracotta shrink-0" />
                    <p className="text-sm text-text-secondary">{orientation.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
