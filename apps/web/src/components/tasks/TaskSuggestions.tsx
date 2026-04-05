'use client';

import { useRef } from 'react';
import type { TaskVariant } from '@/lib/utils/taskVariants';
import { formatVariantSubtitle } from '@/lib/utils/taskVariants';

interface TaskSuggestionsProps {
  query: string;
  variants: TaskVariant[];
  onSelect: (variant: TaskVariant) => void;
  visible: boolean;
}

export function TaskSuggestions({ query, variants, onSelect, visible }: TaskSuggestionsProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!visible || variants.length === 0) return null;

  const q = query.toLowerCase();

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-background-card shadow-md"
    >
      {variants.map((variant, i) => {
        const title = variant.title;
        const lowerTitle = title.toLowerCase();
        const matchIndex = lowerTitle.indexOf(q);
        const subtitle = formatVariantSubtitle(variant);

        return (
          <button
            key={`${title}-${variant.category}-${variant.recurrence}-${variant.estimatedMinutes}-${i}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur before click fires
              onSelect(variant);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background ${i > 0 ? 'border-t border-border-light' : ''}`}
          >
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm text-text-primary">
                {matchIndex >= 0 ? (
                  <>
                    {title.substring(0, matchIndex)}
                    <span className="font-bold text-terracotta">
                      {title.substring(matchIndex, matchIndex + q.length)}
                    </span>
                    {title.substring(matchIndex + q.length)}
                  </>
                ) : (
                  title
                )}
              </span>
              <span className="text-xs text-text-muted">{subtitle}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
