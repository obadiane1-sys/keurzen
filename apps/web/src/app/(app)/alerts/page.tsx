'use client';

import { useMemo } from 'react';
import { ArrowLeftRight, Clock, AlertCircle, Bell } from 'lucide-react';
import {
  useAlerts,
  useMarkAlertAsRead,
  useMarkAllAlertsAsRead,
} from '@keurzen/queries';
import type { Alert, AlertLevel, AlertType } from '@keurzen/shared';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const levelStyle: Record<
  AlertLevel,
  { color: string; bg: string; label: string }
> = {
  balanced: { color: 'var(--color-sauge)', bg: 'bg-sauge/10', label: 'Equilibre' },
  watch: { color: 'var(--color-miel)', bg: 'bg-miel/10', label: 'Attention' },
  unbalanced: { color: 'var(--color-rose)', bg: 'bg-rose/10', label: 'Desequilibre' },
};

const typeConfig: Record<
  AlertType,
  { label: string; Icon: typeof ArrowLeftRight }
> = {
  task_imbalance: { label: 'Repartition des taches', Icon: ArrowLeftRight },
  time_imbalance: { label: 'Temps investi', Icon: Clock },
  overload: { label: 'Surcharge', Icon: AlertCircle },
};

function formatWhen(iso: string): string {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return `Aujourd'hui ${d.format('HH:mm')}`;
  if (d.isSame(dayjs().subtract(1, 'day'), 'day'))
    return `Hier ${d.format('HH:mm')}`;
  return d.format('DD MMM YYYY');
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { mutate: markOne } = useMarkAlertAsRead();
  const { mutate: markAll, isPending: markAllPending } = useMarkAllAlertsAsRead();

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alertes</h1>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'A jour'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              if (confirm('Tout marquer comme lu ?')) markAll();
            }}
            disabled={markAllPending}
            className="text-sm font-bold text-terracotta hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            Tout lire
          </button>
        )}
      </div>

      {/* Content */}
      {alerts.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] bg-background-card p-10 shadow-card text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sauge/10 text-sauge">
            <Bell size={22} />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-1">
            Aucune alerte
          </h2>
          <p className="text-sm text-text-muted">
            Tout va bien dans votre foyer. Continuez comme ca !
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onRead={() => !alert.read && markOne(alert.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AlertRow({ alert, onRead }: { alert: Alert; onRead: () => void }) {
  const level = levelStyle[alert.level];
  const type = typeConfig[alert.type] ?? typeConfig.overload;
  const Icon = type.Icon;

  return (
    <li>
      <button
        onClick={onRead}
        className={`w-full text-left flex items-start gap-3 rounded-[var(--radius-lg)] bg-background-card p-4 shadow-card border transition-all ${
          alert.read
            ? 'border-transparent'
            : 'border-l-4 border-l-terracotta border-border'
        } hover:-translate-y-px hover:shadow-md`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${level.bg}`}
          style={{ color: level.color }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-bold text-text-primary">
              {type.label}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${level.bg}`}
              style={{ color: level.color }}
            >
              {level.label}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-snug">
            {alert.message}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {formatWhen(alert.created_at)}
          </p>
        </div>
        {!alert.read && (
          <span className="w-2 h-2 rounded-full bg-terracotta shrink-0 mt-2" />
        )}
      </button>
    </li>
  );
}
