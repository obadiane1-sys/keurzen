'use client';

import { useState } from 'react';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import {
  useTaskTimeLogs,
  useAddTimeLog,
  useDeleteTimeLog,
} from '@keurzen/queries';
import type { TimeLog } from '@keurzen/shared';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

interface TimeLogSectionProps {
  taskId: string;
}

export function TimeLogSection({ taskId }: TimeLogSectionProps) {
  const { data: logs = [], isLoading } = useTaskTimeLogs(taskId);
  const [showModal, setShowModal] = useState(false);

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <div className="mt-6 pt-4 border-t border-border-light">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-prune" />
          <h3 className="text-sm font-semibold text-text-primary">
            Temps enregistre
          </h3>
          {logs.length > 0 && (
            <span className="text-xs text-text-muted">
              ({totalMinutes} min, {logs.length} entree{logs.length > 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-xs font-semibold text-terracotta hover:opacity-80 transition-opacity"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-text-muted">Chargement...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-text-muted italic">
          Aucune entree de temps pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <TimeLogRow key={log.id} log={log} taskId={taskId} />
          ))}
        </ul>
      )}

      {showModal && (
        <AddTimeLogModal taskId={taskId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function TimeLogRow({ log, taskId }: { log: TimeLog; taskId: string }) {
  const { mutate: deleteLog, isPending } = useDeleteTimeLog(taskId);
  const authorName = log.profile?.full_name?.split(' ')[0] ?? 'Membre';
  const when = dayjs(log.logged_at).format('DD MMM à HH:mm');

  return (
    <li className="flex items-start justify-between rounded-md bg-background/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {log.minutes} min{' '}
          <span className="text-text-muted font-normal">par {authorName}</span>
        </p>
        <p className="text-[11px] text-text-muted">{when}</p>
        {log.note && (
          <p className="text-xs text-text-secondary mt-1 break-words">
            {log.note}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          if (confirm('Supprimer cette entree ?')) deleteLog(log.id);
        }}
        disabled={isPending}
        className="ml-3 rounded p-1 text-text-muted hover:bg-rose/10 hover:text-rose disabled:opacity-50 transition-colors"
        aria-label="Supprimer l'entree"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

// ─── Add modal ───────────────────────────────────────────────────────────────

function AddTimeLogModal({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const { mutateAsync: addLog, isPending } = useAddTimeLog();
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseInt(minutes, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Entrez un nombre de minutes positif.');
      return;
    }
    try {
      await addLog({ taskId, minutes: parsed, note });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] bg-background-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">
            Ajouter du temps
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-border-light hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-muted">
              Minutes
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
              autoFocus
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-terracotta focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">
              Note (facultatif)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Courses faites, vaisselle, etc."
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-terracotta focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border-light transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded bg-terracotta px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
