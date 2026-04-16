'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCheck,
  Clock,
  Activity,
  AlertTriangle,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import {
  useWeeklyReview,
  useWeeklyReviewHistory,
  useRegenerateReport,
} from '@keurzen/queries';
import type { WeeklyReviewSummary } from '@keurzen/queries';
import type { AttentionPoint, Insight, Orientation, MemberMetric } from '@keurzen/shared';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-joy)';
  return 'var(--color-accent)';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '\u2014';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Correct';
  return '\u00c0 am\u00e9liorer';
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

const MEMBER_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-primary)',
  'var(--color-joy)',
  'var(--color-accent)',
];

// ─── Score Gauge (SVG) ───────────────────────────────────────────────────────

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--color-border-light)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold leading-none text-text-primary">
          {score}
        </span>
        <span className="text-xs text-text-muted">/100</span>
      </div>
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-background/50 transition-colors min-h-[44px]"
      >
        <span className="shrink-0" style={{ color: iconColor }}><Icon size={16} /></span>
        <span className="flex-1 text-sm font-semibold text-text-secondary">{title}</span>
        <span className="text-xs text-text-muted">({count})</span>
        <Chevron size={14} className="text-text-muted" />
      </button>
      {expanded && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

// ─── History Item ────────────────────────────────────────────────────────────

function HistoryItem({
  item,
  onPress,
}: {
  item: WeeklyReviewSummary;
  onPress: () => void;
}) {
  const score = item.balance_score !== null ? Math.round(item.balance_score) : null;
  const scoreColor = score !== null ? getScoreColor(score) : undefined;

  return (
    <button
      onClick={onPress}
      className="flex w-full items-center justify-between py-3 border-b border-border-light last:border-b-0 hover:bg-background/50 transition-colors min-h-[44px]"
    >
      <span className="text-sm text-text-primary">
        Sem. du {formatWeekDate(item.week_start)}
      </span>
      <div className="flex items-center gap-2">
        {score !== null && (
          <span
            className="px-2 py-0.5 text-xs font-bold rounded"
            style={{ backgroundColor: scoreColor + '20', color: scoreColor }}
          >
            {score}
          </span>
        )}
        <span className="text-xs text-text-muted">{item.total_tasks_completed} taches</span>
        <ChevronRight size={14} className="text-text-muted" />
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WeeklyReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <WeeklyReviewContent />
    </Suspense>
  );
}

function WeeklyReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get('week') ?? undefined;
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(weekParam);

  const { data: review, isLoading, error, refetch } = useWeeklyReview(selectedWeek);
  const { data: history = [] } = useWeeklyReviewHistory(8);
  const regenerate = useRegenerateReport();

  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    insights: true,
    orientations: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex h-64 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-text-muted">Impossible de charger le bilan</p>
          <button
            onClick={() => refetch()}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────
  if (!review) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-text-muted">Pas encore de bilan cette semaine</p>
          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
          >
            {regenerate.isPending ? 'Generation...' : 'Generer le bilan'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Review content ───────────────────────────────────────────────
  const balanceScore = review.balance_score !== null ? Math.round(review.balance_score) : null;
  const hasMetrics = review.balance_score !== null;
  const scoreColor = balanceScore !== null ? getScoreColor(balanceScore) : 'var(--color-text-muted)';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="text-right">
          <h1 className="font-heading text-lg font-bold text-text-primary">
            Bilan de la semaine
          </h1>
          <p className="text-xs text-text-muted">
            Semaine du {formatWeekDate(review.week_start)}
          </p>
        </div>
      </div>

      {/* Score + Label */}
      {hasMetrics && (
        <Card className="mb-4">
          <div className="flex items-center justify-around py-2">
            <ScoreGauge score={balanceScore ?? 0} color={scoreColor} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-text-primary">
                {getScoreLabel(balanceScore)}
              </span>
              <span className="text-xs text-text-muted">Equilibre du foyer</span>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="flex flex-col items-center py-4 gap-1">
            <CheckCheck size={20} className="text-success" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {review.total_tasks_completed}
            </span>
            <span className="text-xs text-text-muted">Taches</span>
          </Card>
          <Card className="flex flex-col items-center py-4 gap-1">
            <Clock size={20} className="text-primary" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {formatMinutes(review.total_minutes_logged)}
            </span>
            <span className="text-xs text-text-muted">Temps</span>
          </Card>
          <Card className="flex flex-col items-center py-4 gap-1">
            <Activity size={20} className="text-primary" />
            <span className="font-heading text-xl font-bold text-text-primary">
              {review.avg_tlx_score !== null ? Math.round(review.avg_tlx_score) : '\u2014'}
            </span>
            <span className="text-xs text-text-muted">TLX moy.</span>
          </Card>
        </div>
      )}

      {/* Member Breakdown */}
      {hasMetrics && review.member_metrics.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-bold text-text-primary mb-3">Repartition par membre</p>
          <div className="space-y-3">
            {review.member_metrics.map((m: MemberMetric, i: number) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const sharePercent = Math.round(m.tasks_share * 100);
              return (
                <div key={m.user_id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-text-primary flex-1">{m.name}</span>
                    <span className="text-xs text-text-muted">
                      {m.tasks_count} tache{m.tasks_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={sharePercent} color={color} />
                    <span className="text-xs font-semibold text-text-secondary w-9 text-right tabular-nums">
                      {sharePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AI Report */}
      <Card className="mb-4 !p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <BarChart3 size={18} className="text-primary" />
          <span className="text-sm font-bold text-text-primary">Rapport IA</span>
        </div>
        <p className="px-4 pb-3 text-sm text-text-primary leading-relaxed">
          {review.summary}
        </p>

        {/* Attention Points */}
        {review.attention_points.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={AlertTriangle}
              iconColor="var(--color-accent)"
              title="Points d'attention"
              count={review.attention_points.length}
              expanded={expandedSections.attention}
              onToggle={() => toggleSection('attention')}
            >
              {review.attention_points.map((item: AttentionPoint, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: item.level === 'warning' ? 'var(--color-accent)' : 'var(--color-joy)' }}
                  />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Insights */}
        {review.insights.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={Lightbulb}
              iconColor="var(--color-primary)"
              title="Insights"
              count={review.insights.length}
              expanded={expandedSections.insights}
              onToggle={() => toggleSection('insights')}
            >
              {review.insights.map((item: Insight, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Orientations */}
        {review.orientations.length > 0 && (
          <>
            <div className="h-px bg-border-light" />
            <CollapsibleSection
              icon={Compass}
              iconColor="var(--color-success)"
              title="Orientations"
              count={review.orientations.length}
              expanded={expandedSections.orientations}
              onToggle={() => toggleSection('orientations')}
            >
              {review.orientations.map((item: Orientation, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.priority === 'high'
                        ? 'var(--color-success)'
                        : 'var(--color-text-muted)',
                    }}
                  />
                  <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}

        {/* Regenerate */}
        <div className="h-px bg-border-light" />
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-sm text-text-muted hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={regenerate.isPending ? 'animate-spin' : ''} />
          {regenerate.isPending ? 'Regeneration...' : 'Regenerer le rapport'}
        </button>
      </Card>

      {/* History */}
      {history.length > 1 && (
        <Card className="mb-8">
          <p className="text-sm font-bold text-text-primary mb-2">Historique</p>
          {history
            .filter((h) => h.week_start !== review.week_start)
            .map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onPress={() => setSelectedWeek(item.week_start)}
              />
            ))}
        </Card>
      )}
    </div>
  );
}
