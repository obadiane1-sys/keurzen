'use client';

interface AlertData {
  id: string;
  type: 'alert' | 'plan' | 'social';
  label: string;
  title: string;
  actionLabel: string;
  color: string;
}

interface AlertCardProps {
  alert: AlertData;
  fullWidth?: boolean;
}

export const MOCK_ALERTS: AlertData[] = [
  {
    id: 'alert-1',
    type: 'alert',
    label: 'Alert',
    title: 'Ta charge mentale semble augmenter (+15%).',
    actionLabel: 'Mesures',
    color: '#F4C2C2',
  },
  {
    id: 'plan-1',
    type: 'plan',
    label: 'Plan',
    title: 'Prenez 15 minutes ce soir pour planifier.',
    actionLabel: 'Détails',
    color: '#967BB6',
  },
  {
    id: 'social-1',
    type: 'social',
    label: 'Social',
    title: 'Thomas a complété 5 tâches. Remerciez-le !',
    actionLabel: 'Envoyer',
    color: '#967BB6',
  },
];

export function AlertCard({ alert, fullWidth }: AlertCardProps) {
  if (alert.type === 'social' && fullWidth) {
    return (
      <div className="rounded-[2.5rem] border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card flex items-center justify-between py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-2xl">💝</span>
          </div>
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full border bg-white/50 inline-block mb-1 min-w-16 text-center self-start"
              style={{ color: alert.color, borderColor: 'rgba(255,255,255,0.8)' }}
            >
              {alert.label}
            </span>
            <h3 className="text-xs font-bold text-text-primary leading-tight">
              {alert.title}
            </h3>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase font-heading shadow-md hover:scale-105 transition-transform">
          {alert.actionLabel}
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border-[1.5px] border-border bg-gradient-to-br from-background-card to-background-card-end shadow-card p-4"
      style={{ borderTopWidth: '4px', borderTopColor: alert.color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full border bg-white/50 min-w-16 text-center"
          style={{ color: alert.color, borderColor: 'rgba(255,255,255,0.8)' }}
        >
          {alert.label}
        </span>
        <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
          <span className="text-sm">{alert.type === 'alert' ? '⚠️' : '📅'}</span>
        </div>
      </div>
      <h3 className="text-xs font-bold text-text-primary mb-3 leading-relaxed">
        {alert.title}
      </h3>
      <button
        className="text-[10px] font-bold uppercase tracking-wider font-heading flex items-center gap-1 hover:opacity-70 active:scale-[0.97] transition-all duration-150"
        style={{ color: alert.color }}
      >
        {alert.actionLabel} →
      </button>
    </div>
  );
}
