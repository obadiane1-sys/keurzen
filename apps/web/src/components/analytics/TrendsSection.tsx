'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsTrends } from '@keurzen/queries';

export function TrendsSection() {
  const { data: trends = [], isLoading } = useAnalyticsTrends(4);

  const hasEnoughData = trends.filter((t) => t.totalTasks > 0).length >= 2;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Evolution sur 4 semaines
        </p>
        <p className="text-sm text-text-muted text-center py-6">Chargement...</p>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="rounded-2xl bg-background-card p-5 shadow-card">
        <p className="text-sm font-bold text-text-primary mb-4">
          Evolution sur 4 semaines
        </p>
        <p className="text-sm text-text-muted text-center py-6">
          Les tendances apparaitront apres 2 semaines d&apos;utilisation
        </p>
      </div>
    );
  }

  const chartData = trends.map((t) => ({
    week: t.weekLabel,
    tasks: t.totalTasks,
    tlx: t.avgTlxScore,
  }));

  const tooltipStyle = {
    backgroundColor: 'var(--color-background-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 12,
  };

  const xAxisProps = {
    dataKey: 'week' as const,
    tick: { fontSize: 10, fill: 'var(--color-text-muted)' },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div className="rounded-2xl bg-background-card p-5 shadow-card">
      <p className="text-sm font-bold text-text-primary mb-4">
        Evolution sur 4 semaines
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">
            Taches completees
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis {...xAxisProps} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-primary)' }}
                name="Taches"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">
            Charge mentale (TLX)
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis {...xAxisProps} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="tlx"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-primary)' }}
                name="TLX"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
