'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Dumbbell,
  Clock,
  Flame,
  Frown,
  Trophy,
} from 'lucide-react';
import {
  useCurrentTlx,
  useSubmitTlx,
  useTlxHistory,
} from '@keurzen/queries';
import { computeTlxScore } from '@keurzen/shared';
import type { TlxFormValues, TlxEntry } from '@keurzen/shared';
import { Card } from '@/components/ui/Card';

// ─── Dimension config ──────────────────────────────────────────────────────

const DIMENSIONS: {
  key: keyof TlxFormValues;
  label: string;
  description: string;
  color: string;
  Icon: typeof Brain;
}[] = [
  { key: 'mental_demand', label: 'Exigence mentale', description: 'Reflexion, concentration, memoire requises', color: 'var(--color-primary)', Icon: Brain },
  { key: 'physical_demand', label: 'Exigence physique', description: 'Activite physique necessaire', color: 'var(--color-accent)', Icon: Dumbbell },
  { key: 'temporal_demand', label: 'Pression temporelle', description: 'Sentiment de manquer de temps', color: 'var(--color-joy)', Icon: Clock },
  { key: 'performance', label: 'Performance', description: 'Satisfaction de votre travail (100 = tres satisfait)', color: 'var(--color-success)', Icon: Trophy },
  { key: 'effort', label: 'Effort', description: "Intensite de l'effort fourni", color: 'var(--color-primary)', Icon: Flame },
  { key: 'frustration', label: 'Frustration', description: 'Sentiment de decouragement, stress', color: 'var(--color-accent)', Icon: Frown },
];

// ─── Score helpers ──────────────────────────────────────────────────────────

function tlxColor(score: number): string {
  if (score <= 33) return 'var(--color-success)';
  if (score <= 66) return 'var(--color-primary)';
  return 'var(--color-accent)';
}

function tlxLabel(score: number): string {
  if (score <= 30) return 'Legere';
  if (score <= 55) return 'Moderee';
  if (score <= 75) return 'Elevee';
  return 'Critique';
}

// ─── SVG Gauge (live preview) ──────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = tlxColor(score);
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading text-4xl font-extrabold leading-none transition-colors duration-300"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-text-muted">/100</span>
      </div>
    </div>
  );
}

// ─── Dimension Slider ──────────────────────────────────────────────────────

function DimensionSlider({
  dim,
  value,
  onChange,
}: {
  dim: (typeof DIMENSIONS)[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const Icon = dim.Icon;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: dim.color }} />
          <span className="text-sm font-semibold text-text-primary">{dim.label}</span>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color: dim.color }}>
          {value}
        </span>
      </div>
      <p className="text-xs text-text-muted mb-3">{dim.description}</p>

      {/* Range slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tlx-slider w-full h-2 rounded-full appearance-none cursor-pointer"
        aria-label={`${dim.label}, ${value} sur 100`}
        style={{
          '--slider-color': dim.color,
          '--slider-pct': `${value}%`,
        } as React.CSSProperties}
      />

      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-text-muted">Tres faible</span>
        <span className="text-[11px] text-text-muted">Tres forte</span>
      </div>
    </Card>
  );
}

// ─── History entry ─────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: TlxEntry }) {
  const color = tlxColor(entry.score);
  const weekDate = new Date(entry.week_start);
  const formatted = weekDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
      <span className="text-sm text-text-secondary">Sem. du {formatted}</span>
      <div
        className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] border-2"
        style={{ borderColor: color }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          {entry.score}
        </span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function TlxPage() {
  const router = useRouter();
  const { data: currentTlx, isLoading } = useCurrentTlx();
  const { data: history = [] } = useTlxHistory(8);
  const submitTlx = useSubmitTlx();

  const [values, setValues] = useState<TlxFormValues>({
    mental_demand: 50,
    physical_demand: 50,
    temporal_demand: 50,
    performance: 50,
    effort: 50,
    frustration: 50,
  });

  // Sync when async data arrives
  useEffect(() => {
    if (currentTlx) {
      setValues({ // eslint-disable-line react-hooks/set-state-in-effect
        mental_demand: currentTlx.mental_demand,
        physical_demand: currentTlx.physical_demand,
        temporal_demand: currentTlx.temporal_demand,
        performance: currentTlx.performance,
        effort: currentTlx.effort,
        frustration: currentTlx.frustration,
      });
    }
  }, [currentTlx]);

  const previewScore = useMemo(() => computeTlxScore(values), [values]);

  const handleSubmit = async () => {
    try {
      await submitTlx.mutateAsync(values);
      window.alert('Bilan enregistre !');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      window.alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Charge mentale
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Questionnaire NASA-TLX
        </p>
      </div>

      {/* Intro text */}
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        {currentTlx
          ? 'Vous avez deja rempli cette semaine. Vous pouvez mettre a jour vos reponses.'
          : 'Evaluez votre charge mentale cette semaine sur chaque dimension (0 = tres faible, 100 = tres forte).'}
      </p>

      {/* Score preview card */}
      <Card className="mb-6">
        <div className="flex flex-col items-center py-4">
          <ScoreGauge score={previewScore} />
          <p className="text-xs text-text-muted mt-3">Score prevu</p>
          <p className="text-sm font-bold mt-1" style={{ color: tlxColor(previewScore) }}>
            {tlxLabel(previewScore)}
          </p>
        </div>
      </Card>

      {/* Dimension sliders */}
      <div className="space-y-3 mb-8">
        {DIMENSIONS.map((dim) => (
          <DimensionSlider
            key={dim.key}
            dim={dim}
            value={values[dim.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [dim.key]: v }))}
          />
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitTlx.isPending}
        className="w-full rounded-[var(--radius-lg)] bg-primary py-3.5 text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
      >
        {submitTlx.isPending
          ? 'Enregistrement...'
          : currentTlx
            ? 'Mettre a jour'
            : 'Enregistrer mon bilan'}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Historique
          </p>
          <Card>
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
