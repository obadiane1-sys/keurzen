import { ChevronRight, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TlxEntry } from '@keurzen/shared';

interface TlxCardProps {
  currentTlx: TlxEntry | null | undefined;
  tlxDelta: { score: number; delta: number | null; hasComparison: boolean } | null | undefined;
}

function tlxColor(score: number): string {
  if (score <= 33) return 'var(--color-sauge)';
  if (score <= 66) return 'var(--color-prune)';
  return 'var(--color-rose)';
}

export function TlxCard({ currentTlx, tlxDelta }: TlxCardProps) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Charge mentale
      </p>
      <Card>
        {currentTlx ? (
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px]"
              style={{ borderColor: tlxColor(currentTlx.score) }}
            >
              <span
                className="font-heading text-xl font-bold"
                style={{ color: tlxColor(currentTlx.score) }}
              >
                {currentTlx.score}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Score TLX</p>
              {tlxDelta?.hasComparison && tlxDelta.delta !== null && (
                <p
                  className="text-xs"
                  style={{
                    color: tlxDelta.delta > 0 ? 'var(--color-rose)' : 'var(--color-sauge)',
                  }}
                >
                  {tlxDelta.delta > 0 ? '+' : ''}
                  {tlxDelta.delta} vs semaine derniere
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Zap size={28} className="text-prune shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Evaluez votre charge mentale</p>
              <p className="text-xs text-text-muted">Remplissez le questionnaire TLX</p>
            </div>
            <ChevronRight size={16} className="text-text-muted shrink-0" />
          </div>
        )}
      </Card>
    </div>
  );
}
