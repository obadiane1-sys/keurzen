import type { StatsKpi } from '@keurzen/queries';

interface Props {
  kpis: StatsKpi[];
}

export function KpiGrid({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-6 py-6">
      {kpis.map((kpi) => (
        <div key={kpi.key}>
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            {kpi.label}
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-[32px] font-extrabold text-[var(--color-text-primary)]">
              {kpi.value}
            </span>
            {kpi.unit && (
              <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">
                {kpi.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
