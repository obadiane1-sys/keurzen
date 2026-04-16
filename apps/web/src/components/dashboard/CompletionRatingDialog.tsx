'use client';

import { useState } from 'react';
import { useCompleteTaskWithRating } from '@keurzen/queries';

interface CompletionRatingDialogProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

const RATING_OPTIONS = [
  { value: 1 as const, label: 'Legere', description: 'Rapide et simple', emoji: '🍃' },
  { value: 2 as const, label: 'Moyenne', description: 'Effort modere', emoji: '⏱️' },
  { value: 3 as const, label: 'Lourde', description: "Demande beaucoup d'energie", emoji: '🏋️' },
];

export function CompletionRatingDialog({ taskId, taskTitle, onClose }: CompletionRatingDialogProps) {
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const completeWithRating = useCompleteTaskWithRating();

  function handleRate(rating: 1 | 2 | 3) {
    setSelected(rating);
    completeWithRating.mutate(
      { taskId, rating },
      { onSuccess: onClose, onError: () => setSelected(null) },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background-card rounded-t-3xl px-6 pt-6 pb-10 shadow-lg animate-in slide-in-from-bottom">
        <h3 className="text-center font-bold text-text-primary mb-1">
          Comment etait cette tache ?
        </h3>
        <p className="text-center text-sm text-text-secondary mb-2">
          {taskTitle}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto block text-xs text-text-muted hover:text-text-secondary mb-4"
        >
          Passer
        </button>

        <div className="space-y-3">
          {RATING_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            const isDisabled = selected !== null && !isSelected;

            return (
              <button
                key={option.value}
                onClick={() => handleRate(option.value)}
                disabled={selected !== null}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-[1.5px] border-border bg-background-card transition-opacity ${
                  isDisabled ? 'opacity-40' : 'hover:bg-white/60'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div className="text-left">
                  <p className="font-bold text-text-primary">{option.label}</p>
                  <p className="text-sm text-text-secondary">{option.description}</p>
                </div>
                {isSelected && completeWithRating.isPending && (
                  <span className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
