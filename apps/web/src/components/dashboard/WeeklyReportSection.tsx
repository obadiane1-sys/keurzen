'use client';

import { useWeeklyReport } from '@keurzen/queries';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

export function WeeklyReportSection() {
  const { data: report, isLoading } = useWeeklyReport();

  if (isLoading) return null;
  if (!report) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Rapport de la semaine
      </p>
      <Card className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">{report.summary}</p>

        {report.attention_points.length > 0 && (
          <div className="space-y-2">
            {report.attention_points.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 text-miel shrink-0" />
                <p className="text-sm text-text-secondary">{point.text}</p>
              </div>
            ))}
          </div>
        )}

        {report.insights.length > 0 && (
          <div className="space-y-2">
            {report.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lightbulb size={14} className="mt-0.5 text-prune shrink-0" />
                <p className="text-sm text-text-secondary">{insight.text}</p>
              </div>
            ))}
          </div>
        )}

        {report.orientations.length > 0 && (
          <div className="space-y-2">
            {report.orientations.map((orientation, i) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight size={14} className="mt-0.5 text-terracotta shrink-0" />
                <p className="text-sm text-text-secondary">{orientation.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
