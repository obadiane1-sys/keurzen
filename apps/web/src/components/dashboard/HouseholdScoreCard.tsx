'use client';

interface HouseholdScoreCardProps {
  score: number;
  trend: number | null;
}

const GAUGE_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HouseholdScoreCard({ score, trend }: HouseholdScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="rounded-[2.5rem] p-5 border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary mb-1 font-heading">
            Score du Foyer
          </h2>
          <div className="flex items-baseline gap-1">
            <p className="text-6xl font-extrabold text-text-primary font-heading leading-none">
              {clamped}
            </p>
            <p className="text-xl font-bold text-primary font-heading">/100</p>
          </div>
          {trend !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-white font-bold bg-primary/80 px-3 py-1 rounded-full flex items-center shadow-inner gap-1">
                {trend >= 0 ? '↑' : '↓'} {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                Semaine
              </p>
            </div>
          )}
        </div>
        <div className="relative w-28 h-28">
          <svg
            className="w-full h-full -rotate-90 drop-shadow-sm"
            viewBox="0 0 112 112"
          >
            <circle
              cx="56" cy="56" r={RADIUS}
              fill="none" stroke="white" strokeWidth={STROKE_WIDTH}
            />
            <circle
              cx="56" cy="56" r={RADIUS}
              fill="none" stroke="var(--color-primary)" strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <span className="text-3xl">⚖️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
