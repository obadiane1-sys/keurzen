import { getDeltaColor } from '@keurzen/shared';

interface Props {
  score: number;
  delta: number | null;
  coachMessage: string | null;
}

export function ScoreHero({ score, delta, coachMessage }: Props) {
  return (
    <section className="flex flex-col items-center py-8">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        Score global
      </span>
      <div className="mt-3 flex items-baseline">
        <span className="text-[88px] font-extrabold leading-[96px] text-[var(--color-text-primary)]">
          {score}
        </span>
        {delta !== null && delta !== 0 && (
          <span className="ml-2 text-sm font-bold" style={{ color: getDeltaColor(delta) }}>
            {`${delta > 0 ? '+' : ''}${delta}%`}
          </span>
        )}
      </div>
      {coachMessage && (
        <p className="mt-4 max-w-md px-4 text-center text-[13px] italic text-[var(--color-text-secondary)]">
          {`\u00AB ${coachMessage} \u00BB`}
        </p>
      )}
      <div className="mt-6 h-px w-10 bg-[var(--color-border)]" />
    </section>
  );
}
